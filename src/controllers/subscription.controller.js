import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You can't subscribe to your own channel");
    }

    // Check if the user is already subscribed to the channel
    const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    });

    if (subscription) {
        // If already subscribed, unsubscribe
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(200).json(new ApiResponse(200, "Subscription removed"));
    }

    // If not subscribed, subscribe to the channel
    const subscribed = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });

    if (!subscribed) {
        throw new ApiError(500, "Unable to subscribe to this channel");
    }

    return res.status(200).json(new ApiResponse(200, subscribed, "Subscription added"));
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}