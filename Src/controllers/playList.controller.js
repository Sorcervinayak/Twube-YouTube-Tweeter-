import asyncHandler from "../utils/AsyncHandler";
import { ApiError } from "../utils/APiError";
import { Apiresponse } from "../utils/APIResponse";
import { PlayList } from "../models/playList.models";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playListId } = req.params;

  if (!name.trim()) {
    throw new ApiError(400, "name is not found");
  }
  if (!description.trim()) {
    throw new ApiError(400, "Description not found");
  }

  const Playlist = await PlayList.create({
    name: name.trim(),
    description: description.trim(),
    videos: [],
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new Apiresponse(200, PlayList, "Playlist created successfully"));
});

const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId, playListId } = req.params;
  // If getting specific playlist
  if (playListId) {
    const playlist = await PlayList.findById(playListId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    // Authorization check
    if (playlist.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized to access this playlist");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, playlist, "Playlist fetched successfully"));
  }
  const { page = 1, limit = 10 } = req.query;
  //calculate page
  const skip = (page - 1) * limit;

  const Playlists = await PlayList.find({ owner: userId })
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const totalPlaylists = await PlayList.countDocuments({ owner: userId });
  return res.status(200).json(
    new Apiresponse(
      200,
      {
        Playlists,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPlaylists / limit),
        totalPlaylists,
      },
      "User's playlists fetched successfully"
    )
  );
});

const getPlayListById = asyncHandler(async (req, res) => {
  const { playListId } = req.params;

  // If getting specific playlist
  if (!playListId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  const playlist = await PlayList.findById(playListId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Authorization check
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to access this playlist");
  }
  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlayList = asyncHandler(async (req, res) => {
  const { playListId, videoId } = req.params;
  if (!playListId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const playlist = await PlayList.findById(playListId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  // Authorization check
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to access this playlist");
  }

  //Check if that video is already exist in the playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already exist in playlist");
  }

  playlist.videos.push(videoId);
  playlist.save();

  return res
    .status(200)
    .json(
      new Apiresponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlayList = asyncHandler(async (req, res) => {
  const { playListId, videoId } = req.params;

  const playlist = await PlayList.findById(playListId);

  if (!playListId) {
    throw new ApiError(400, "Playlist Id is required");
  }

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "User not authorized to remove video from playlist"
    );
  }

  //remove the video
  playlist.videos = playlist.videos.filter((vid) => vid.toString() != videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video removed successfully"));
});

const deletePlayList = asyncHandler(async (req, res) => {
  const { playListId } = req.params;

  if (!playListId) {
    throw new ApiError(400, "Playlist Id is required");
  }

  const playlist = await PlayList.findById(playListId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this playlist");
  }

  await PlayList.findByIdAndDelete(playListId);

  return res
    .status(200)
    .json(new Apiresponse(200, null, "Playlist deleted successfully"));
});
const updatePlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playListId } = req.params;

  if (!playListId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  // Find playlist first to check ownership
  const playlist = await PlayList.findById(playListId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check ownership
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to update this playlist");
  }

  // Create update object with only provided fields
  const updateFields = {};
  if (name !== undefined && name.trim()) {
    updateFields.name = name.trim();
  }
  if (description !== undefined) {
    updateFields.description = description.trim();
  }

  // Don't include videos or owner - they shouldn't be updated here

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playListId,
    { $set: updateFields },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new Apiresponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});
export {
  createPlayList,
  getUserPlayList,
  getPlayListById,
  addVideoToPlayList,
  removeVideoFromPlayList,
  deletePlayList,
  updatePlayList,
};
