import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Playlist} from "../models/playlist.model.js";
import {Video} from "../models/video.model.js";

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name, description} = req.body;
    const ownerId = req.user?._id;
    if(!name || !description){
        throw new ApiError(400, "All fields needed");
    }
    if (!ownerId) {
        throw new ApiError(401, "User not authenticated");
    }
    
    const playlist = await Playlist.create({
        name,
        description,
        owner : ownerId,
    });
    if(!playlist){
        throw new ApiError(500, "Playlist creation failed!!!");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist creation successfull!!!"));
});

const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playId} = req.params;
    if(!playId){
        throw new ApiError(400, "Playlist ID required");
    }

    const playlist = await Playlist.findById(playId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playId);

    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

const getUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400, "User ID missing or user not logged in!!");
    }

    const playlists = await Playlist.findOne({owner: userId});
    if(!playlists || playlists.length === 0){
        throw new ApiError(404, "User have no playlists!!!");
    }

    return res.status(200).json(new ApiResponse(200, playlists, "User or paramater playlists fetched successfully!!!"));
});

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "Playlist ID required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(500, "Playlist with given ID not available!!!");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist of the ID fetched successfully!!!"));
});

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    const {name, description} = req.body;
    if(!((playlistId)&&(name||description))){
        throw new ApiError(400, "All fields and ID required!!!");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    const updates = {};

    if (name) updates.name = name;
    if (description) updates.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, updates, { new: true });
    // const updates = await Playlist.findByIdAndUpdate(playlistId,{
    //     $set:{
    //         $or:[
    //             {
    //                 name: name,
    //             },
    //             {
    //                 description: description,
    //             }
    //         ]
    //     }
    // },{new:true}); this is one method

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist Updated details!!"));
});

const addVideoPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params;
    if(!(playlistId && videoId)){
        throw new ApiError(400, "Both ID required!!");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!!");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video does not exist!!");
    }
    // Check if the video is uploaded by the same user who owns the playlist
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You can only add videos you uploaded to your playlist");
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already exists in the playlist!");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully!"));
});

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    const {playId, videoId} = req.params;
    if(!(playId&&videoId)){
        throw new ApiError(400, "Playlist ID and Video ID are required!");
    }

    const playlist = await Playlist.findById(playId);
    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!!");
    }
    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    if(!playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video not found in the playlist!!!");
    }

    playlist.videos = playlist.videos.filter(
        (v) => {
           return v.toString() !== videoId;
        }
    );//using return explictly
    // playlist.videos = playlist.videos.filter(v => v.toString() !== videoId); need not explictly return both are same 

    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from the playlist!!!"));
});

export {createPlaylist, deletePlaylist, getUserPlaylist, getPlaylistById, updatePlaylist,addVideoPlaylist,removeVideoFromPlaylist};