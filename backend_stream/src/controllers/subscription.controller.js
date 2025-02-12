import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle Subscription (Subscribe or Unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // Channel ID to subscribe/unsubscribe
    const userId = req.user._id; // Logged-in user ID

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if the user is already subscribed to the channel
    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

    if (existingSubscription) {
        // If the user is already subscribed, unsubscribe them
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed from channel"));
    } else {
        // If the user is not subscribed, subscribe them
        const newSubscription = new Subscription({
            subscriber: userId,
            channel: channelId
        });
        await newSubscription.save();
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed to channel"));
    }
});

// Get the list of subscribers for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // Channel ID to fetch subscribers for

    // Find all subscriptions where the 'channel' is the provided channelId
    const subscribers = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'username fullname avatar') // Populate the subscriber information
        .exec();

    if (!subscribers.length) {
        return res.status(200).json(new ApiResponse(200, [], "No subscribers found"));
    }

    return res.status(200).json(new ApiResponse(200, subscribers.map(sub => sub.subscriber), "Subscribers fetched successfully"));
});

// Get the list of channels a user is subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params; // User ID to fetch the subscribed channels for

    // Find all subscriptions where the 'subscriber' is the provided subscriberId
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate('channel', 'username fullname avatar') // Populate the channel information
        .exec();

    if (!subscriptions.length) {
        return res.status(200).json(new ApiResponse(200, [], "No subscriptions found"));
    }

    return res.status(200).json(new ApiResponse(200, subscriptions.map(sub => sub.channel), "Subscribed channels fetched successfully"));
});

export { getUserChannelSubscribers, toggleSubscription, getSubscribedChannels };