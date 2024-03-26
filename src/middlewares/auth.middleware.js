import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        // to get decoded information from jwt like (_id, email, etc)
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // findById is db request 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "invalid Access Token")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
})


