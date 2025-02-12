import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import { json } from "express";
import mongoose from "mongoose";

const registerUser = asyncHandler(async(req, res)=>{
    const {username, password, email, phone} = req.body

    //validation 
    if([username,password,email,phone].some((field)=>field?.trim() === "")){
        throw new ApiError(400, "All fields are required!!!")
    }

    //check if the user exists in the DB
    const existedUser = await User.findOne({
        $or: [{username},{email},{phone}]
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists!!!")
    }

    //handle images
    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing!!!")
    }

    //upload image to coludinary
    // const avatar = await uploadOnCloudinary(avatarLocalPath)

    // let coverImage = ""
    // if(coverLocalPath){
    //     coverImage = await uploadOnCloudinary(avatarLocalPath)
    // } writing better code instead of this

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar", avatar)
    } catch (error) {
        console.log("Error uploading avatar",error)
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded coverimage", coverImage)
    } catch (error) {
        console.log("Error uploading cover image",error)
        throw new ApiError(500, "Failed to upload cover image")
    }

    try {
        console.log("Level1")
        const user = await User.create({
            username : username.toLowerCase(),
            password, 
            email, 
            phone,
            avatar : avatar.url,
            coverImage : coverImage?.url || ""
        })
        console.log(user)
        console.log("Level1")
        const createdUser = await User.findById(user._id).select("-password -refreshtoken")
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registring the user!!!")
        }
        console.log("Level2")
        return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully!!!!"))
    } catch (error) {
        console.log("user creation failed");
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "Error registring new user images were deleted!!")
    }
})

const generateAccessTokenandRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens")
    }
}

const loginUser = asyncHandler(async (req,res)=>{
    const {username, password, email} = req.body
    if(!email){
        throw new ApiError(400, "Email Required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }
    const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {user:loggedInUser, accessToken, refreshToken},"User logged in successfully"))
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly:true,
        secure: process.env.NODE_ENV === "production"
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid refresh token!!!")
        }
        const options = {
            httpOnly: true,
            secure : process.env.NODE_ENV === "production"
        }
        const {accessToken , refreshToken: newRefreshToken} = await generateAccessTokenandRefreshToken(user._id)

        return res.
        status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200, 
            {accessToken, refreshToken:newRefreshToken},
            "Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing the access token")
    }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordValid = user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid current or old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "Current user details returned"))
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {email} = req.body
    if(!email){
        throw new ApiError(400, "Email is required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                email : email
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    return res.status(200),json(new ApiResponse(200, user,"Email updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "File is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, "Avatar file upload failed internal error")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password - refreshToken")
    return res.status(200).json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
        throw new ApiError(400, "Image file reqired")
    }
    const coverImage = await uploadOnCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(500, "Image update failed internal error")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },{new : true}
    ).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params 
    if(!username?.trim){
        throw new ApiError(400, "Username is required")
    }
    const channel = await User.aggregate(
        [
            {
                $match:{
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
                    channedlsSubscribedToCount :{
                        $size: "$subscribedTo"
                    },
                    isSubscribed :{
                        $cond :{
                            if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project:{
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    channedlsSubscribedToCount:1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email:1
                }
            }
        ]
    )
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile found successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                // _id: new mongoose.Types.ObjectId(req.user?._id)
                _id : req.user?._id
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchhistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline: [{
                                $project:{
                                    username : 1,
                                    avatar:1
                                }
                            }]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    if(!user){
        throw new ApiError(503, "Data fetch failed")
    }
    return res.status(200).json(200, user[0]?.watchHistory, "Watch history fetched")
})


export {registerUser, loginUser, refreshAccessToken, logoutUser, changeCurrentPassword, getCurrentUser, updateUserAvatar, updateAccountDetails, updateUserCoverImage,getUserChannelProfile, getWatchHistory}