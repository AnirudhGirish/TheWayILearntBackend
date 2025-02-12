import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {Comment} from '../models/comment.model.js';

const addComment = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    const {vidId} = req.params;
    const userId = req.user._id;
    if(!(content && vidId && userId)){
        throw new ApiError(400, "Content needed, video ID needs to be passed and user needs to be logged in!!!");
    }

    const comment = await Comment.create({
        content : content,
        video : vidId,
        owner : userId
    });
    if(!comment){
        throw new ApiError(500, "Error creating comment!!");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment created successfully!!!"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Extract the commentId from the URL
    const { content } = req.body; // Extract the new content from the request body

    if (!content) {
        throw new ApiError(400, "Content is required to update the comment!");
    }

    // Check if the comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    // Ensure the logged-in user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment!");
    }

    // Update the comment with the new content
    comment.content = content;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Extract the commentId from the URL params

    // Check if the comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    // Ensure the logged-in user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment!");
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Return the response
    return res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;  // Extract videoId from params
    const { page = 1, limit = 10 } = req.query;  // Extract pagination data from query parameters

    // Ensure page and limit are integers
    const skip = (page - 1) * limit;  // Calculate the number of comments to skip for pagination
    const limitValue = parseInt(limit);

    // Check if videoId is valid
    if (!videoId) {
        throw new ApiError(400, "Video ID is required to fetch comments");
    }

    // Fetch the comments for the video, with pagination and populate owner info
    const comments = await Comment.find({ video: videoId })
        .skip(skip)
        .limit(limitValue)
        .populate({
            path: 'owner',
            select: 'fullname username avatar',  // Only select necessary fields from the owner
        })
        .sort({ createdAt: -1 });  // Optional: Sort comments by creation date (most recent first)

    if (!comments.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    // Get the total number of comments to calculate pagination data
    const totalComments = await Comment.countDocuments({ video: videoId });

    // Calculate total pages
    const totalPages = Math.ceil(totalComments / limitValue);

    const pagination = {
        totalComments,
        totalPages,
        currentPage: page,
        pageSize: limitValue,
    };

    // Return the response with comments and pagination data
    return res.status(200).json(new ApiResponse(200, { comments, pagination }, "Comments fetched successfully"));
});

export {addComment, updateComment, deleteComment, getVideoComments};