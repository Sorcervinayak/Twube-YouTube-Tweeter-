import { Comment } from "../models/comment.models"
import { ApiError } from "../utils/APiError"
import { Apiresponse } from "../utils/APIResponse"
import { asyncHandler } from "../utils/AsyncHandler"


//Comments controller
const getComments = asyncHandler(async(req,res)=>{
  //get all comments for a video
  const {videoId} = req.params //fetch the video id from the url coming
  const {page=1,limit = 10} = req.query

  const comments = await Comment.find({video: videoId}).populate("owner","username avatar") //Fetches all comments where the video field matches the given videoId
  .skip((page-1) * limit).
  limit(parseInt(limit)) 
  return res.status(200).json(
    new Apiresponse(200, comments,"Comments fetched successfully")
  )
})

const addComment = asyncHandler(async(req,res)=>{
    const{videoId} = req.params //fetch the video id from the url
    const {content} = req.body//fetch the content from the body of the comment

    if(!content?.trim()){
        throw new ApiError(400,"Contents cannot be empty")
    }

    //otherwise create the and updates to the comment model
    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id,
    })

    return res.status(200).json(
        new Apiresponse(200,comment,"comment added successfully")
    )
})

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const{content} = req.body

    if(!content?.trim()){
        throw new ApiError(400,"Cntents cannot be empty")
    }

    //find comment by id
    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    //Check ownership
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content =  content
    await comment.save()

    return res.status(200).json(
        new Apiresponse(200,comment,"Comment updated successfully")
    )

})

const deleteComment  = asyncHandler(async(req,res)=>{

    const{commentId} = req.params

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    //check the ownerShip
    if(comment.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "You are not allowed to update this comment");
    }
    
    await comment.remove()

    return res.status(200).json(
        new Apiresponse(200,comment,"Comment deleted successfully")
    )
})
export {
    getComments,
    addComment,
    updateComment,
    deleteComment
}