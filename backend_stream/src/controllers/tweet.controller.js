import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Tweet} from "../models/tweet.model.js";

const addTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    const userId = req.user._id;
    if(!content){
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        owner : userId,
        content : content,
    });
    if(!tweet){
        throw new ApiError(500, "Error creating tweet");
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    const userId = req.user._id;

    if(!tweetId){
        throw new ApiError(400, "TweetId missing");
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400, "Tweet does not exist");
    }

    if(tweet.owner.toString() !== userId.toString()){
        throw new ApiError(401, "User not authorized to delete");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

const updateTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;
    const userId = req.user._id;
    if(!tweetId || !content){
        throw new ApiError(400, "TweetId missing");
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400, "Tweet does not exist");
    }

    if(tweet.owner.toString() !== userId.toString()){
        throw new ApiError(401, "User not authorized to delete");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        content : content,
    },{ new: true });

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });  // Sort by newest tweets first

    if (!tweets || tweets.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No tweets found"));
    }

    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});


export {addTweet, deleteTweet,updateTweet,getUserTweets};