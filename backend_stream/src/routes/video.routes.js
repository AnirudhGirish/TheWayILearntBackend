import {Router} from "express";
import {publishVideo,deleteVideo,updatevideo,getVideoById,getAllVideos, addToWatchHistory} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/getvideo/:vidId").get(getVideoById);
router.route("/allvideos").get(getAllVideos);

//Secure routes
router.route("/publish").post(verifyJWT, upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),publishVideo);
router.route("/delete/:vidId").delete(verifyJWT, deleteVideo);
router.route("/update/:vidId").patch(verifyJWT, upload.single("thumbnail"),updatevideo);
router.route("/history/:vidId").patch(verifyJWT, addToWatchHistory);

export default router;