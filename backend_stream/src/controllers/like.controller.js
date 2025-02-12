import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle Like on a Video (Like or Unlike)
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Video ID to like/unlike
    const userId = req.user._id; // Logged-in user ID

    // Check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({ likedBy: userId, video: videoId });

    if (existingLike) {
        // If the like already exists, unlike the video (delete the like)
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, null, "Video unliked successfully"));
    } else {
        // If the like doesn't exist, like the video (create a new like)
        const newLike = new Like({
            likedBy: userId,
            video: videoId
        });
        await newLike.save();
        return res.status(200).json(new ApiResponse(200, newLike, "Video liked successfully"));
    }
});

// Get All Liked Videos by the Current User
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Logged-in user ID

    // Find all likes by the current user
    const likedVideos = await Like.find({ likedBy: userId })
                                  .populate('video', 'title description videofile thumbnail owner')
                                  .exec();

    // If no liked videos, return an empty response
    if (!likedVideos.length) {
        return res.status(200).json(new ApiResponse(200, [], "No liked videos found"));
    }

    // Map through the liked videos and return only the video details
    const videos = likedVideos.map(like => like.video);

    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export { getLikedVideos, toggleVideoLike };