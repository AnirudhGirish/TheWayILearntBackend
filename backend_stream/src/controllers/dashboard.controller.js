import mongoose from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID (channel owner)
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const skip = (page - 1) * limit;

    // Fetch all videos uploaded by the channel owner (logged-in user)
    const videos = await Video.find({ owner: userId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by most recent videos

    const totalVideos = await Video.countDocuments({ owner: userId });

    const pagination = {
        totalVideos,
        totalPages: Math.ceil(totalVideos / limit),
        currentPage: page,
        pageSize: limit,
    };

    return res.status(200).json(new ApiResponse(200, { videos, pagination }, "Channel videos fetched successfully"));
});

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID (channel owner)

    // Get the total number of videos uploaded by the user (channel owner)
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Get the total number of views across all videos of the channel
    // const totalViews = await Video.aggregate([
    //     { $match: { owner: new mongoose.Schema.Types.ObjectId(userId) } },
    //     { $group: { _id: null, totalViews: { $sum: "$views" } } }
    // ]);

    // const totalVideoViews = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    // Get the total number of subscribers (subscriptions) to the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Get the total number of likes on the channel's videos
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ owner: userId }).select('_id') } });

    const stats = {
        totalVideos,
        // totalVideoViews,
        totalSubscribers,
        totalLikes,
    };

    return res.status(200).json(new ApiResponse(200, stats, "Channel statistics fetched successfully"));
});

export {getChannelStats, getChannelVideos};