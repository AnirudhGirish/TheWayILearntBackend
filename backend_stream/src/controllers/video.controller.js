import {Video} from '../models/video.model.js';
import {User} from '../models/user.model.js';
import {Comment} from "../models/comment.model.js";
import {Like} from "../models/like.model.js";
import {Playlist} from "../models/playlist.model.js";
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary, uploadVideoOnCloudinary} from '../utils/cloudinary.js';
import mongoose from 'mongoose';

const publishVideo = asyncHandler(async(req,res)=>{
    const {title, description} = req.body;
    const ownerId = req.user?._id;
    if (!ownerId) {
        throw new ApiError(401, "User not authenticated");
    }
    if(!(title || description)){
        throw new ApiError(400, "All fields are required!!");
    }
    const localVideo = req.files?.video[0]?.path;
    if(!localVideo){
        throw new ApiError(400, "Video file required!!");
    }
    const localThumbnail = req.files?.thumbnail[0]?.path;
    if(!localThumbnail){
        throw new ApiError(400, "Thumbnail file required!!");
    }
    const video = await uploadVideoOnCloudinary(localVideo);
    if(!video.url){
        throw new ApiError(500, "Error uploading the video!!");
    }
    const thumbnail = await uploadOnCloudinary(localThumbnail);
    if(!thumbnail.url){
        throw new ApiError(500, "Error uploading the video!!");
    }
    const videoModel = await Video.create({
        title,
        description,
        owner : ownerId,
        // videofile : video.url,
        videofile: video.eager[2]?.secure_url, // Save HLS URL
        thumbnail: thumbnail.url,
        duration: video.duration,
    });

    const publishedVideo = await Video.findById(videoModel._id);
    if(!publishedVideo){
        throw new ApiError(501, "Error creating video in model");
    }
    return res.status(200).json(new ApiResponse(200, publishVideo, "Video Published successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.vidId;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Fetch the video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Fetch the user's ID (from req.user)
    const userId = req.user._id;

    // Check if the video belongs to the user (owner check)
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete the video media from Cloudinary
    await deleteVideoFromCloudinary(video.videofile);  // Assuming videoUrl is the Cloudinary file URL
    await deleteFromCloudinary(video.thumbnail);  // Assuming thumbnailUrl is the Cloudinary file URL

    // Delete comments associated with the video
    await Comment.deleteMany({ video: videoId });

    // Delete likes associated with the video
    await Like.deleteMany({ video: videoId });

    // Remove the video from any playlists
    await Playlist.updateMany(
        { videos: videoId },
        { $pull: { videos: videoId } }
    );

    // Finally, delete the video from the database
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
});

const updatevideo = asyncHandler(async(req,res)=>{
    const {vidId} = req.params;
    if(!vidId){
        throw new ApiError(402, "Video ID not found!!");
    }

    const video = await Video.findById(vidId);
    if (!video) {
        throw new ApiError(400, "Video not found with this ID!!");
    }

    // Check if the logged-in user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const {title, description} = req.body;
    const thumbnail = req.file?.path;
    if(!(title || description || thumbnail)){
        throw new ApiError(402, "Atleast one field required to update");
    }

    const updateContent = {};

    if(title) updateContent.title = title;
    if(description) updateContent.description = description;
    if(thumbnail) {
        const newThum = await uploadOnCloudinary(thumbnail);
        if(!newThum.url){
            throw new ApiError(500, "Error uploading to cloudinary");
        }
        updateContent.thumbnail = newThum.url;
    }

    const upCont = await Video.findByIdAndUpdate(vidId,updateContent,{new:true});
    if(!upCont){
        throw new ApiError(500, "Update to DB failed!!!");
    }

    return res.status(200).json(new ApiResponse(200, upCont, "Video Content updated successfully"));
});

const getVideoById = asyncHandler(async(req,res)=>{
    const {vidId} = req.params;
    if(!vidId){
        throw new ApiError(200, "Video Id required to get video!!");
    }

    const video = await Video.findById(vidId);
    if(!video){
        throw new ApiError(400, "Couldnt find video with this ID!!");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully!!!"));
});

const getAllVideos = asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortBy='createdAt',sortType='desc',userId} = req.query;

    // Calculate pagination values
    const skip = (page-1)*limit;
    const limitValue = parseInt(limit);

    // Build sorting
    const sort = {};
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    let filters = {};
    if (query) {
        const regexQuery = new RegExp(query, 'i');
        filters = {
            $or: [
                { title: { $regex: regexQuery } },
                { description: { $regex: regexQuery } }
            ]
        };
    }

    if (userId) {
        filters.userId = userId;
    }

    const videos = await Video.find(filters).skip(skip).limit(limitValue).sort(sort);
    const totalVideos = await Video.countDocuments(filters);
    const pagination = {
        totalVideos,
        totalPages: Math.ceil(totalVideos / limitValue),
        currentPage: page,
        pageSize: limitValue
    };

    return res.status(200).json(new ApiResponse(200, { videos, pagination }, "Videos fetched successfully"));
});

const addToWatchHistory = asyncHandler(async (req, res) => {
    const { vidId } = req.params;  // video ID
    const userId = req.user._id;   // user ID from the authenticated user

    // Check if the video exists
    const video = await Video.findById(vidId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Find the user and check if they exist
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the video is already in watchHistory to avoid duplicates
    if (!user.watchHistory.includes(vidId)) {
        user.watchHistory.push(vidId);  // Add video to user's watch history
        await user.save();  // Save the updated user document
    }

    return res.status(200).json(new ApiResponse(200, null, "Video added to watch history"));
});


export {publishVideo, deleteVideo, updatevideo, getVideoById, getAllVideos, addToWatchHistory};