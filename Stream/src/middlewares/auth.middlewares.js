import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    const token = req.cookie.accessToken || req.body.accessToken || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401, "unauthorized")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Unauthorized!!!")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized auth req due to invalid access token!!")
    }
    
})