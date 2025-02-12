const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

export {asyncHandler}

// for understanding "Higher order functions" they can accept and return a function..
/*
const asyncHandler = () => {}
const asyncHandler = (func) = {() => {}}
const asyncHandler = (func) = async () => {}
*/

// two methods to build asyncHandler using promiese and one more is using async await
/*
const asyncHandler = (func) = async (req,res,next) => {
    try {
        await func(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message : error.message
        })
    }
}
*/ //this is using try catch the main code is done using promises
