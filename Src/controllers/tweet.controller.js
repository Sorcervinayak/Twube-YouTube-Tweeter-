import { Tweet } from "../models/tweets.models";
import { ApiError } from "../utils/APiError";
import { APIResponse } from "../utils/APIResponse"; // Fixed casing
import { asyncHandler } from "../utils/AsyncHandler";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    // Validate content - FIXED: 400 status and safe navigation
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    // Create tweet - FIXED: populate after creation
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    });

    // Populate owner details after creation
    await tweet.populate("owner", "username email avatar");

    return res.status(201).json( // FIXED: 201 for resource creation
        new APIResponse(201, tweet, "Tweet created successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Authorization check - FIXED: Added toString() for consistency
    if (userId !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to access these tweets");
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find tweets with pagination and sorting
    const userTweets = await Tweet.find({ owner: userId })
        .populate("owner", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const totalTweets = await Tweet.countDocuments({ owner: userId });

    return res.status(200).json(
        new APIResponse(200, {
            tweets: userTweets,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalTweets,
                totalPages: Math.ceil(totalTweets / limit),
                hasNextPage: (page * limit) < totalTweets,
                hasPrevPage: page > 1
            }
        }, "Tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    // Validate content - FIXED: Safe navigation
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this tweet");
    }

    // FIXED: Correct variable naming
    const updateFields = {
        content: content.trim()
    };

    // FIXED: Correct variable name and added runValidators
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).populate("owner", "username email avatar");

    return res.status(200).json(
        new APIResponse(200, updatedTweet, "Tweet updated successfully") // Fixed variable name
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // FIXED: Find tweet first to check existence and ownership
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new APIResponse(200, {}, "Tweet deleted successfully") // FIXED: Proper response format
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};