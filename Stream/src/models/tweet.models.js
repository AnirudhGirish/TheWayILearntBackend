// Post[icon:file]{ (tweet)
//     id string pk
//     content string
//     owner ObjedctId User
//     createdAt timestamp
//     updatedAt timestamp
//   }

import mongoose, {Schema} from "mongoose";

const tweetschema = new Schema({
    content : {
        type : String,
        required :true,
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps : true})

export const Tweet = mongoose.model("Tweet", tweetschema)