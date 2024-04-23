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
})

const deleteComment = asyncHandler(async (req, res) => {
    //Todo: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}