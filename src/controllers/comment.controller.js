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