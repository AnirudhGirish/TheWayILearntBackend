import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type: Schema.Types.ObjectId,
        ref: "User"
    },//one who subscribing 
    channel : {
        type: Schema.Types.ObjectId,
        ref: "User"
    }//one subscribed
},{timestamps:true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);