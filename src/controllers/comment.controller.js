import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //Todo: get All comments for a video
    const { videoId } = req.param;
    const { page = 1, limit = 10 } = req.query;
})

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