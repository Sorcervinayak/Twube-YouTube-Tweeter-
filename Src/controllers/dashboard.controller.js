import { ApiError } from "../utils/APiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { Subscription } from "../models/subscriptions.models";
import { User } from "../models/user.models";
import {Video} from "../models/video.models"

const getChannelStats = asyncHandler(async(req,res)=>{
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400,"Channel Id is required")
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    //Get basic counts
    const totalSubscribers = await Subscription.countDocument({channel : channelId})
    const totalVideos = await Video.countDocument({owner : channelId})
    const totalViews = await Video.aggregate([
        {$match: {owner: new mongoose.Types.ObjectId(channelId)}},
        {$group: {_id: null, totalViews: {$sum: "$views"}}}
    ]) 

     const stats = {
        channelInfo: {
            username: channel.username,
            avatar: channel.avatar,
            channelName: channel.channelName
        },
        statistics: {
            totalSubscribers,
            totalVideos,
            totalViews: totalViews[0]?.totalViews || 0,
            joinedDate: channel.createdAt
        }
    }

    return res.status(200).json(
        new Apiresponse(200, stats, "Channel statistics fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    
    if(!channelId) {
        throw new ApiError(400, "Channel ID is required")
    }

    // Check if channel exists
    const channel = await User.findById(channelId)
    if(!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const {page = 1, limit = 20, sortBy = "newest"} = req.query
    const skip = (page - 1) * limit

    // Sort options
    let sortOptions = {}
    switch(sortBy) {
        case "newest":
            sortOptions = {createdAt: -1}
            break
        case "oldest":
            sortOptions = {createdAt: 1}
            break
        case "popular":
            sortOptions = {views: -1}
            break
        case "mostLiked":
            sortOptions = {likes: -1}
            break
        default:
            sortOptions = {createdAt: -1}
    }

    const videos = await Video.find({owner: channelId, isPublished: true})
        .select('title thumbnail duration views likes commentsCount createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOptions)

    const totalVideos = await Video.countDocuments({owner: channelId, isPublished: true})

    return res.status(200).json(
        new Apiresponse(200, {
            channelInfo: {
                username: channel.username,
                channelName: channel.channelName,
                avatar: channel.avatar
            },
            videos,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalVideos / limit),
                totalVideos,
                hasNextPage: page < Math.ceil(totalVideos / limit),
                hasPrevPage: page > 1
            }
        }, "Channel videos fetched successfully")
    )
})

export {getChannelStats,getChannelVideos}