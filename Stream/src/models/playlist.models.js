// Playlist[icon:list]{
//     id string pk
//     name string
//     description string
//     videos ObjedctId[] Video
//     owner ObjedctId User
//     createdAt timestamp
//     updatedAt timestamp 
//   }

import mongoose, {Schema} from "mongoose";

const playlistschema = new Schema({
    name : {
        type: String,
        required: true,
    },
    description : {
        type: String,
        required: true,
    },
    videos : [{
        type : Schema.Types.ObjectId,
        ref : "Video"
    }],
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
}, {timestamps : true})

export const Playlist = mongoose.model("Playlist", playlistschema)