import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import {Comment} from "../models/comment.model.js";
import {Like} from "../models/like.model.js";
import {Playlist} from "../models/playlist.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Tweet} from "../models/tweet.model.js";
import {transporter} from "../utils/mailer.js";
import {uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary} from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId) => {
    try { 
        const user = await User.findById(userId);

        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token!!!");
    }
};



const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token required for new access token!!!");
    };

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Invalid token!!!")
        };
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token has issues!!!")
        };
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user?._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken:newrefreshToken} ,"Access token refreshed using refresh token and both updated"))
    } catch (error) {
        new ApiError(401, error?.message || "Invalid refresh token or auth error")
    }
});

const registerUser = asyncHandler(async(req,res)=>{
    const {username, email, fullname, password} = req.body;
    //get user details from frontend

    if([username, email, fullname, password].some((field)=>field?.trim() === "")){
        throw new ApiError(400, "All fields are required!!!")
    };
    //validation - not empty

    const userExists = await User.findOne({$or: [{username},{email}]});
    if(userExists){
        throw new ApiError(409, "User already exists!!!")
    };
    //check if already exists : username & email

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required!!!");
    };
    //check for images : for avatar :required

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar is required!!!");
    };
    //upload images to cloudinary :url

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    });//create user object and create user in db

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500, "Error registring the user and commiting to database!!!");
    };
    //check if user created and remove password & refresh token

    return res.status(201).json(new ApiResponse(201, createdUser ,"User Registered Successfully!!!"));
    //return response
});

const loginUser = asyncHandler(async(req,res)=>{
    const {username,password} = req.body;
    //get data

    if(!username){
        throw new ApiError(400, "Username or email is required!!!");
    };
    //username or email 

    // const user = await User.findOne({$or:[{username},{email}]});
    const user = await User.findOne({username});
    if(!user){
        throw new ApiError(404, "User does not exist!!!");
    };
    //find the user

    const validPassword = await user.isPasswordCorrect(password);
    if(!validPassword){
        throw new ApiError(401, "Password incorrect!!!");
    };
    //password check

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    //access and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
    };
    const response = res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user : loggedInUser, accessToken, refreshToken}, "User logged in successfully!!!"));
    return response;
    //return or send tokens in secure cookies
});

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                refreshToken: undefined
            },
        },
        {
            new:true
        }
    );

    const options = {
        httpOnly : true,
        secure: true
    }


    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged out successfully!!!"));
});

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Incorrect old password!!!");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed!!!"))
});

const forgotPassword = asyncHandler(async(req,res)=>{
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = await user.generateResetPasswordToken();
    const resetUrl = `http://localhost:8000/api/v1/users/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Password Reset Request',
        text: `You can reset your password using the following link: ${resetUrl}`,
    };
    console.log(`${email} and ${resetToken} and ${resetUrl}`)
    await transporter.sendMail(mailOptions);

    return res.status(200).json(new ApiResponse(200,null,"Password reset link sent to your email"));
});

const resetPassword = asyncHandler(async(req,res)=>{
    const { newPassword } = req.body;
    const { token } = req.params;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the token has expired
    if (user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: 'Password reset token has expired' });
    }

    // Set the new password (the pre-save hook will hash it)
    user.password = newPassword;

    // Clear the reset token and expiration time
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the user with the new password
    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Password has been reset successfully"));
});

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "Current user info fetched successfully!!!"));
});

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body;
    if(!fullname || !email){
        throw new ApiError(400, "All fields are required!!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname : fullname,
                email : email
            }
        },
        {new:true}
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!!!"))
});

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file missing!!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar!!!");
    }

    const usr = await User.findById(req.user?._id);
    if(!usr){
        throw new ApiError(400, "User not found!!!");
    }

    const usrAvatar = await usr.avatar;
    if(!usrAvatar){
        throw new ApiError(500, "Couldnt fetch avatar from DB");
    } 
    await deleteFromCloudinary(usrAvatar);

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set:{
            avatar : avatar.url,
            }
        },
        {
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar updated successfully!!!"));
});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file?.path;
    if(!coverLocalPath){
        throw new ApiError(400, "Cover image file rquired!!!");
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Error uploading cover image!!!");
    }

    const usr = await User.findById(req.user?._id);
    if(!usr){
        throw new ApiError(400, "User not found!!!");
    }

    const usrCoverImage = await usr.coverImage;
    if(!usrCoverImage){
        throw new ApiError(500, "Couldnt fetch cover image from DB");
    } 
    await deleteFromCloudinary(usrCoverImage);

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage : coverImage.url,
        }
    },{new:true}).select("-password");

    return res.send(200).json(new ApiResponse(200, user, "User Cover Image updated successfully!!!"));
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username missing!!!");
    }

    const channel = await User.aggregate
    (
        [
            {
                $match : {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount : {
                        $size : "$subscribers"
                    },
                    channelsSubscribedToCount : {
                        $size : "$subscribedTo"
                    },
                    isSubscribed : {
                        $cond : {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project:{
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ]
    );

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "Channel's user profile fetched successfully!!!"));
});

// const getWatchHistory = asyncHandler(async(req,res)=>{
//     const user = await User.aggregate(
//         [
//             {
//                 $match: {
//                     _id : new mongoose.Schema.Types.ObjectId(req.user._id)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "videos",
//                     localField: "watchHistory",
//                     foreignField: "_id",
//                     as: "watchHistory",
//                     pipeline: [
//                         {
//                             $lookup:{
//                                 from: "users",
//                                 localField: "owner",
//                                 foreignField: "_id",
//                                 as: "owner",
//                                 pipeline: [
//                                     {
//                                         $project: {
//                                             fullname:1,
//                                             username:1,
//                                             avatar:1
//                                         }
//                                     }
//                                 ]
//                             }
//                         },
//                         {
//                             $addFields:{
//                                 owner:{
//                                     $first: "$owner"
//                                 }
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]
//     );

//     return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully!!!"));
// });
//simplified watchhistory using populate
const getWatchHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
        .populate({
            path: 'watchHistory',
            options: {
                skip,
                limit,
            },
            populate: {
                path: 'owner',
                select: 'fullname username avatar',
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, user.watchHistory, "Watch history fetched successfully!"));
}); //also pagination is handeld

const deleteUser = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId) {
        throw new ApiError(400, "Need user data to delete user!!!");
    }

    // Fetch the user
    const usr = await User.findById(userId);
    if (!usr) {
        throw new ApiError(400, "User not found!!!");
    }

    // Delete avatar and cover image from Cloudinary
    const usrAvatar = usr.avatar;
    if (usrAvatar) {
        await deleteFromCloudinary(usrAvatar);
    }

    const usrCoverImage = usr.coverImage;
    if (usrCoverImage) {
        await deleteFromCloudinary(usrCoverImage);
    }

    // Cascade delete all user's videos
    const userVideos = await Video.find({ owner: userId });
    if (userVideos.length > 0) {
        for (let video of userVideos) {
            // Delete comments associated with the video
            await Comment.deleteMany({ video: video._id });

            // Delete likes associated with the video
            await Like.deleteMany({ video: video._id });

            // Remove video from all playlists
            await Playlist.updateMany(
                { videos: video._id },
                { $pull: { videos: video._id } }
            ); 

            // Delete the video media from Cloudinary
            await deleteVideoFromCloudinary(video.videofile);  // Assuming videoUrl is the Cloudinary file URL
            await deleteFromCloudinary(video.thumbnail);  // Assuming thumbnailUrl is the Cloudinary file URL

            // Delete the video document from the database
            await Video.findByIdAndDelete(video._id);
        }
    }

    // Cascade delete user's tweets
    await Tweet.deleteMany({ user: userId });

    // Cascade delete subscriptions: Both user's subscriptions and those to the user
    await Subscription.deleteMany({ $or: [{ subscriber: userId }, { channel: userId }] });

    // Cascade delete user's likes
    await Like.deleteMany({ user: userId });

    // Delete the user document itself
    await User.findByIdAndDelete(userId);

    return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export {registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, resetPassword, forgotPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile,getWatchHistory,deleteUser};

/* registerUser {
get user details from frontend
validation - not empty
check if already exists : username & email
check for images : for avatar :required
upload images to cloudinary :url
create user object
create user in db
check if user created
remove password & refresh token
return response
} */

/* loginUser {
get data
username or email 
find the user
password check
access and refresh token
return or send tokens in secure cookies
} */