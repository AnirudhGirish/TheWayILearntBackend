import { Router } from "express";
import {
    registerUser, changePassword, getCurrentUser,loginUser,logoutUser,refreshAccessToken,updateAccountDetails,updateUserAvatar,updateUserCoverImage, getUserChannelProfile, getWatchHistory, deleteUser, forgotPassword, resetPassword} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
// http://localhost:8000/api/v1/users/register this becomes the url and the further control is given to registerUser //

router.route("/register").post(upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
]), registerUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);


//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar") ,updateUserAvatar);
router.route("/update-cover").patch(verifyJWT,upload.single("coverImage") ,updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);
router.route("/deleteuser").delete(verifyJWT, deleteUser);

export default router;