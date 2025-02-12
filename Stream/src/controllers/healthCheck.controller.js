import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// const healthcheck = async (req,res) => {
//     try {
//         res.status(200).json()
//     } catch (error) {
//         console.log(error)
//     }
// } this is one way we can do this since we have async handler will be doing this the other way.

const healthcheck = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, "OK", "Health check passed"))
}) // this is a good method

export {healthcheck}