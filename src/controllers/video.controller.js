import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    // methods/steps for publishAVideo

    // get data from req body
    const { title, description } = req.body;

    // check title, description exist or not
    if (!title && !description) {
        throw new ApiError(400, "Title and description are required")
    }

    // local path of video
    const videoLocalPath = req.files?.videoFile[0]?.path;

    // local path of thumbnail
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    // check video and thumbnail local path exist or not
    if (!videoLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "videoLocalPath and thumbnailLocalPath is required")
    }

    // upload thumbnail on Cloudinary 
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // upload video on Cloudinary 
    const videoFile = await uploadOnCloudinary(videoLocalPath);


    // check video and thumbnail local path exist or not
    if (!videoFile && !thumbnail) {
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

    // const isPublished = videoFile && thumbnail ? true : false;

    const newVideo = await Video.create(
        {
            videoFile: videoFile?.url,
            title: title,
            description: description,
            thumbnail: thumbnail?.url,
            duration: videoFile?.duration,
            owner: req.user._id
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            newVideo,
            "video published successfully"
        ))
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id = Done
    // get video id from url
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200).
        json(new ApiResponse(200, video, "Video retrieve successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    // get video id from url
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400, "Title and description is required for update them")
    }

    const thumbnailLocalPath = req.file?.path;

    // check thumbnail local path exist or not
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail?.url
            }
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200).
        json(new ApiResponse(200, video, "Video details update successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}