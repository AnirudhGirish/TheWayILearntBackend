// Subscription[icon:dollar-sign]{
//     id string pk
//     subscriber ObjedctId User
//     channel ObjedctId Channel
//     createdAt timestamp
//     updatedAt timestamp 
//   }

import mongoose, {Schema} from "mongoose";

const subscriptionschema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User" // Subscriber
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User" // Subscribed
    }
}, {timestamps : true})

export const Subscription = mongoose.model("Subscription", subscriptionschema)