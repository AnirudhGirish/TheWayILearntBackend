// Video[icon:video]{
//     id string pk
//     title string
//     description string
//     videofile string -nr
//     views number 
//     likes number(ObjedctId[]) Like -nr
//     comments number(ObjedctId[]) Comment -nr
//     owner ObjedctId User
//     duration number
//     thumbnail string -nr
//     createdAt timestamp
//     updatedAt timestamp
//   }

import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoschema = new Schema({
    title : {
        type: String,
        required: true,
    },
    description : {
        type: String,
        required: true,
    },
    views : {
        type : Number,
        required : true,
        default : 0
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    duration : {
        type : Number,
        required: true,
    }
}, {timestamps : true})

videoschema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoschema)