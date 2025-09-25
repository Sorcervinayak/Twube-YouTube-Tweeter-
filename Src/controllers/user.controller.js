import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/APiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { Apiresponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; // Fixed typo: refreshToekn → refreshToken
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path; // Added optional chaining

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log("Files:", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Normalize Windows paths for Cloudinary
  const normalizedAvatarPath = avatarLocalPath.replace(/\\/g, "/");
  const normalizedCoverPath = coverImageLocalPath
    ? coverImageLocalPath.replace(/\\/g, "/")
    : null;

  const avatar = await uploadOnCloudinary(normalizedAvatarPath);
  const coverImage = normalizedCoverPath
    ? await uploadOnCloudinary(normalizedCoverPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, createdUser, "User registered Successfully")); // Fixed status code: 200 → 201
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Fixed condition: should be OR, not AND
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  // Fixed: User → user (capitalization)
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Fixed variable name: refreshToekn → refreshToken
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) // Fixed variable name
    .json(
      new Apiresponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // Fixed variable name
        },
        "User logged In successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  // Fixed: findByIdAndDelete → findByIdAndUpdate
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // Fixed field name
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options) // Fixed cookie name
    .json(new Apiresponse(200, {}, "User logged out successfully")); // Fixed response format
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefershToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefershToken) {
    throw new ApiError(401, "Unauthorizes request");
  }

  try {
    const decodeToken = jwt.verify(incomingRefershToken, REFRESH_TOKEN);

    const user = await User.findById(decodeToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefershToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    options = {
      httpOnly: true,
      secure: true,
    };

    const { newrefreshToken, accessToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new Apiresponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, "Passwod changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new Apiresponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;

  if (!avatarPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndDelete(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new Apiresponse(200, user, "Avatar updated succssfuly"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;

  if (!coverImagePath) {
    throw new ApiError(400, "coverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  const user = await User.findByIdAndDelete(
    req.user?._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new Apiresponse(200, user, "Cover Image updated succssfuly"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "Subscription", // collection name (check in MongoDB, usually lowercase plural)
        localField: "_id",
        foreignField: "channel",
        as: "Subscribers",
      },
    },
    {
      $lookup: {
         from: "Subscription", // collection name (check in MongoDB, usually lowercase plural)
        localField: "_id",
        foreignField: "subscriber",
        as: "SubscribedTo",
      },
    },
    {
      $addFields: {
      subscribersCount: { $size: "$subscribers" },
      subscribedToCount: { $size: "$subscribedTo" },
      isSubscribed: {
        $cond: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // check if logged-in user is a subscriber
          then: true,
          else: false
        }
      }
    }
    },
    {
      $project:{
        fullname:1,
        username:1,
        avatar: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        coverImage:1,
        email: 1,
      }
    }
  ]);

  if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
  }

  return res.status(200)
  .json(
    new Apiresponse(200,channel[0],"User channel fetched successfully")
  )
});

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match: {
       _id : new mongoose.Types.ObjectId(req.user._id) 
      }
    },
    {
      $lookup:{
        from: "Videos",
        localField:"watchHistory",
        foreignField:"_id",
        as: "watchHistory",
        pipeline:[{
          $lookup:{
            from: "users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[{
              $project:{
                fullname:1,
                username:1,
                avatar:1
              }
            }]
          }
        },
        {
          $addFields:{
            owner:{
              $first:"$owner"
            }
          }
        }
      ]
      }
    }
  ])
  return res.status(200)
  .json(
    new Apiresponse(200,user[0].watchHistory,"Watch History fetched successfully")
  )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateCoverImage,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory
};
