import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async(req,res)=>{
    res.status(200).json(new ApiResponse(200, null, "Health Check Successfull !!!"));
});

export {healthCheck};