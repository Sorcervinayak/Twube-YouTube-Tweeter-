import { Subscription } from "../models/subscriptions.models";
import { User } from "../models/user.models"; // Add this import
import { ApiError } from "../utils/APiError";
import { Apiresponse } from "../utils/APIResponse";
import { asyncHandler } from "../utils/AsyncHandler";

const toggleSubscription = asyncHandler(async(req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel id is required")
    }


    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel not found")
    }

    if(channelId === req.user._id.toString()){
        throw new ApiError(400, "Cannot subscribe to your own channel") // Changed to 400 status
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    })

    let subscription
    let message

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        message = "Unsubscribed successfully" 
        subscription = null
    } else {
        subscription = await Subscription.create({ 
            subscriber: req.user._id,
            channel: channelId
        })
        message = "Subscribed successfully"
    }

    return res.status(200).json(
        new Apiresponse(200, { subscription }, message) // Wrap in object for consistency
    )
})

const getChannelSubscribers = asyncHandler (async(req,res)=>{
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400,"Channel id is required")
    }

    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    const {page = 1,limit = 10} = req.query
    const skip = ((page - 1) * limit)

    //get subscriber with pagination
    const subscribers = await Subscription.find({channel : channelId})
    .skip(skip)
    .limit(parseInt(limit))
    .sort({createdAt : -1})

    const totalSubscribers = await Subscription.countDocuments({channel: channelId})

    return res.status(200).json(200,{
        currentPage : parseInt(page),
        totalPages : Math.ceil(totalSubscribers / limit),
        totalSubscribers,
        hasNextPage: page < Math.ceil(totalSubscribers / limit),
        hasPrevPage: page > 1
    },"Subscribers fetched successfully")
})

const getSubscribedChannels = asyncHandler(async(req, res) => {
    const {subscriberId} = req.params
    
    // If no subscriberId provided, use current user
    const targetSubscriberId = subscriberId || req.user._id

    const {page = 1, limit = 20} = req.query
    const skip = (page - 1) * limit

    const subscriptions = await Subscription.find({subscriber: targetSubscriberId})
        .populate('channel', 'username email avatar channelName') // Populate channel details
        .skip(skip)
        .limit(parseInt(limit))
        .sort({createdAt: -1})

    const totalSubscriptions = await Subscription.countDocuments({subscriber: targetSubscriberId})

    return res.status(200).json(
        new Apiresponse(200, {
            channels: subscriptions.map(sub => sub.channel), // Extract channel objects
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSubscriptions / limit),
                totalSubscriptions,
                hasNextPage: page < Math.ceil(totalSubscriptions / limit),
                hasPrevPage: page > 1
            }
        }, "Subscribed channels fetched successfully")
    )
})
export { toggleSubscription,getChannelSubscribers } 

