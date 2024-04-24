import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Basic validation for videoId
    if (!videoId) {
        throw new ApiError(400, "Invalid video ID");
    }

    const pageNumber = parseInt(page);
    const limitOfComments = parseInt(limit);
    const skip = (pageNumber - 1) * limitOfComments;

    // Aggregation pipeline to fetch comments with additional data
    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) } // Match comments for the specific video
        },
        {
            $lookup: {
                from: "users", // Lookup comment owner from users collection
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner"
            }
        },
        {
            $lookup: {
                from: "likes", // Lookup likes associated with each comment
                localField: "_id",
                foreignField: "comment",
                as: "commentLikes"
            }
        },
        {
            $addFields: {
                commentLikesCount: { $size: "$commentLikes" }, // Add field for comment likes count
                commentOwner: { $arrayElemAt: ["$commentOwner", 0] }, // Extract comment owner information
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$commentLikes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                commentOwner: { _id: 1, username: 1, avatar: 1 },
                commentLikesCount: 1,
                isLiked: 1
            }
        },
        { $sort: { createdAt: -1 } }, // Sort comments by createdAt field in descending order
        { $skip: skip }, // Skip comments based on pagination
        { $limit: limitOfComments } // Limit the number of comments per page
    ]);

    // If no comments are found for the given videoId, send an error response
    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found for the video");
    }

    // Send the retrieved comments in the response
    res.status(200).json(new ApiResponse(200, { comments }, "Comments retrieved successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    //Todo: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Invalid video ID")
    }

    // ensure comment is not empty
    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment cannot be empty")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(400, "Failed to add comment")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    //Todo: upadte a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const { _id } = req.user;

    if (!commentId) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // ensure comment is not empty
    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment cannot be empty")
    }

    const comment = await Comment.findByIdAndUpdate(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== _id.toString()) {
        throw new ApiError(401, "You are not authorized to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: { content }
        },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment")
    }


    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    //Todo: delete a comment
    const { commentId } = req.params;
    const { _id } = req.user;

    if (!commentId) {
        throw new ApiError(404, "Comment not found")
    }

    const comment = await Comment.findById(commentId);

    if (comment.owner.toString() !== _id.toString()) {
        throw new ApiError(404, "You are not authorized to delete this comment")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if (!deleteComment) {
        throw new ApiError(404, "comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleteComment, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}