import { Video } from "../models/video.models";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/APiError";
import { Like } from "../models/like.models";
import { Apiresponse } from "../utils/APIResponse";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const user = req.user._id // user logged in

    //find he video by the id
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    //check if user already liked
    const existingLike = await Like.findOne({video:videoId,likedBy:user})

    if(existingLike){
        await Like.deleteOne({_id: existingLike._id})
        return res.status(200).json(
            new Apiresponse(200,{},"Unliked the video")
        )
    }
    else{
        await Like.create({video:videoId,likedBy:user})
        return res.status(200).json(
            new Apiresponse(200,{},"Liked the video")
        )
    }
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const userId = req.user._id

    const existingLike = await Like.findOne({comment : commentId,likedBy: userId})

    if(existingLike){
        await Like.deleteOne({_id:existingLike._id})
        return res.status(200).json(
            new Apiresponse(200,{},"Unliked the video")
        )
    }
    else{
        await Like.create({comment: commentId,likedBy:userId})
        return res.status(200).json(
            new Apiresponse(200,{},"liked the video")
        )
    }
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const userId = req.user._id

    const existingLike = await Like.findOne({tweet:tweetId,likedBy:userId})

    if(existingLike){
        await Like.deleteOne({_id:existingLike._id})
        return res.status(200).json(
            new Apiresponse(200,{},"Unliked the video")
        )
    }else{
        await Like.create({tweet:tweetId , likedBy:userId})
        return res.status(200).json(
            new Apiresponse(200,{},"liked the video")
        )
    }
})
const getLikedVideo = asyncHandler(async(req,res)=>{
        const {videoId} = req.params
        
        const allLikes = await Like.find({video:videoId}).populate("likedBy","username email")

        return res.status(200).json(
            new Apiresponse(200,allLikes,"fteched all the likes on video successfully")
        )
})

export {toggleVideoLike,toggleCommentLike,getLikedVideo,toggleTweetLike}