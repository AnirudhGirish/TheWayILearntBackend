import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    likedBy:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
},{timestamps:true});

export const Like = mongoose.model("Like", likeSchema);