import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// register User 
const registerUser = asyncHandler(async (req, res) => {
    // methods/steps for user registration

    // get user details from frontend 
    // validation - not empty
    // check if user already exist: username , email
    // check for image, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation 
    // return response


    // get user details from frontend 
    const { username, fullName, email, password } = req.body;

    // validation - not empty
    if ([username, fullName, email, password].some(field => field.trim() === "")) {
        throw new ApiError(400, "All Fields Are required")
    }

    // check if user already exist: username , email
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }

    // check for image, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // below way prevent us from undefined error if not url
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "AvatarLocalPath is required")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),

        }
    );

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation 
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created/registered successfully")
    )

})

// logIn User
const loginUser = asyncHandler(async (req, res) => {
    // methods/steps for user login

    // get data from req body
    // check username / email exist or not
    // find the user
    // password check
    // access and refresh token generate
    // send tokens in secure cookies

    // get data from req body
    const { username, email, password } = req.body;

    // check username / email exist or not
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    // here is an alternate approach of above code based on logic discussed
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required");
    // }

    // find the user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user doesn't exist");
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "password is not valid");
    }

    // access and refresh token generate
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // send tokens in secure cookies 
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user Logged In successfully"))
})

// logOut user
const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        },
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    // get refreshToken
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        // decode refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        // get user 
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        // match both  the tokens
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        // generate new token
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        // options for cookie
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "acccessToken refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"));
})


// Define an asynchronous function using asyncHandler middleware
const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        // Assuming res.user is set by middleware
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    res.user,
                    "current user fetched successfully"
                )
            );
    } catch (error) {
        // Handle any errors that occur during the process
        return res.status(500).json({ message: 'Server Error' });
    }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName: fullName, email: email }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const CoverImageLocalPath = req.file?.path;

    if (!CoverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(CoverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage")
    }

    //  TODO: delete old image - assignment

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    //  TODO: delete old image - assignment

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar updated successfully"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    // get user from channel url
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    // use aggregation pipeline to match or filter the document from the dataBase
    const channel = await User.aggregate([
        // match filed
        {
            $match: {
                // hamary pass username ko apny pass mojod username sy match kr lo
                username: username?.toLowerCase()
            }

        },
        // find subscribers or
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        // find subscribed to whom you subscribe
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // add fields in the current user
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribedTo"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // projection to give selected fields
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(
            404, "channel does not exist"
        )
    }

    return res
        .startus(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // sub-pipeline
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // sub-pipeline
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            // overWrite the existing field owner
                            owner: {
                                // extract first element from the array through two ways($first,arrayElementsAt)
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.startus(200)
        .json(
            200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};