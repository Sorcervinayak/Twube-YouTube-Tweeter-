import { Video } from "../models/video.models";
import asyncHandler from "../utils/AsyncHandler";
import { Apiresponse } from "../utils/APIResponse";
import { ApiError } from "../utils/APiError";
import { uploadOnCloudinary } from "../utils/Cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Build mongodb filter object
  const filter = { isPublished: true }; // Only show published videos

  // If search query is provided, match title or description - FIXED SYNTAX
  if (query) {
    filter.$or = [
      // Fixed: removed incorrect bracket
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // If userId is provided, fetch only that user's videos
  if (userId) {
    filter.owner = userId;
  }

  // Decide sorting order
  const sortOrder = sortType === "desc" ? -1 : 1;

  // Fetch videos from the DB
  const videos = await Video.find(filter)
    .populate("owner", "username email avatar")
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  // Total videos
  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new APIResponse( // Fixed: Apiresponse → APIResponse
      200,
      {
        videos,
        pagination: {
          totalVideos,
          currentPage: Number(page),
          totalPages: Math.ceil(totalVideos / limit),
          limit: Number(limit),
          hasNextPage: page * limit < totalVideos,
          hasPrevPage: page > 1,
        },
      },
      "All videos fetched successfully"
    )
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Check if title and description are provided
  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  // Retrieve the paths of thumbnail and videoFile from the req
  const videoFile = req.files?.videoFile?.[0];
  const thumbnail = req.files?.thumbnail?.[0];

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  // Upload video file to cloudinary
  const uploadVideoFile = await uploadOnCloudinary(videoFile.path);
  if (!uploadVideoFile) {
    throw new ApiError(500, "Failed to upload the video on cloudinary");
  }

  // Now upload the thumbnail
  let thumbnailUpload = null;
  if (thumbnail) {
    thumbnailUpload = await uploadOnCloudinary(thumbnail.path);
  }

  // Create video in database - FIXED: changed 'tite' to 'title'
  const video = await Video.create({
    // FIXED: Added 'const video ='
    title: title.trim(),
    description: description?.trim() || "",
    videoFile: uploadVideoFile.url,
    thumbnail: thumbnailUpload?.url || "",
    duration: uploadVideoFile.duration || 0,
    owner: req.user._id,
    isPublished: true,
  });

  // Populate owner details before sending response
  await video.populate("owner", "username email avatar");

  return res
    .status(201)
    .json(new Apiresponse(201, video, "Video published successfully"));
});

const togglePublishedStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //check if user owns the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized user to update this video");
  }

  //Toggle Publish status
  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { isPublished: video.isPublished },
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId)
    .populate("owner", "username avatar email")
    .select("-__v");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //Incremant the videw count (optional)
  video.views += 1;
  await video.save();

  return res
    .status(200)
    .json(new Apiresponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, isPublished } = req.body;
  const thumbnail = req.file;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "User is not authorized to update");
  }

  const updateFeilds = {}; //create object
  if (title !== undefined) {
    if (!title.trim()) {
      throw new ApiError(400, "Title cannot be empty");
    }
    updateFeilds.title = title.trim();
  }

  if (description !== undefined) {
    updateFeilds.description = description.trim();
  }

  if (isPublished !== undefined) {
    updateFeilds.isPublished = isPublished;
  }

  //handle thumbnail update if provided
  if (thumbnail) {
    const thumbnailUpload = await uploadOnCloudinary(thumbnail.path);
    if (!thumbnailUpload) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }
    updateFeilds.thumbnail = thumbnailUpload.url;
  }

  const updateVideoFile = await Video.findByIdAndUpdate(
    videoId,
    {$set : updateFeilds},
    {new : true}
  ).populate("owner","username email avatar")

  return res.status(200).json(
    new Apiresponse(200,updateVideoFile,"Video updated successfully")
  )
});

const deleteVideo = asyncHandler(async(req,res)=>{
  const {videoId} = req.params

  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(404,"Video not found")
  }

  if(video.owner.toString() !== req.user._id.toString()){
    throw new ApiError(403,"User is unauthorized to delete the video")
  }

  await Video.findByIdAndDelete(videoId)

  return res.status(200).json(
    new Apiresponse(200,{},"Video deleted successfully")
  )
})
export { getAllVideos, publishVideo, togglePublishedStatus, getVideoById,updateVideo,deleteVideo, };
