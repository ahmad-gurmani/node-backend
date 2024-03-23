import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // methods for user registration

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
            coverImage: coverImage?.url | "",
            email,
            password,
            username: username.toLowerCase(),

        }
    )

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

export { registerUser };