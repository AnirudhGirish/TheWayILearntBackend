// Like[icon:thumbs-up]{
//     id string pk
//     likedBy ObjedctId User
//     post ObjedctId Post (tweet)
//     video ObjedctId Video
//     comment ObjedctId Comment
//     playlist ObjedctId Playlist -nr
//     createdAt timestamp
//     updatedAt timestamp
//   }

import mongoose, {Schema} from "mongoose";

const likeschema = new Schema({
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    tweet : {
        type : Schema.Types.ObjectId,
        ref : "Tweet"
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    comment : {
        type : Schema.Types.ObjectId,
        ref : "Comment"
    },
    
}, {timestamps : true})

export const Like = mongoose.model("Like", likeschema)