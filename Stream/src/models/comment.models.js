// Comment[icon:comments]{
//     id string pk
//     content string
//     video ObjedctId Video
//     owner ObjedctId User
//     createdAt timestamp
//     updatedAt timestamp
//   }

import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentschema = new Schema({
    content : {
        type : String,
        required : true
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps : true})

commentschema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentschema)