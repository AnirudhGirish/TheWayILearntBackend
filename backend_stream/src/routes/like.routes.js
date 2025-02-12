import {Router} from "express";
import {getLikedVideos, toggleVideoLike} from "../controllers/like.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toogle-like/:videoId").post(toggleVideoLike);
router.route("/get-liked").get(getLikedVideos);

export default router;