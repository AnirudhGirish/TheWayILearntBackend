import {Router} from "express";
import {createPlaylist,deletePlaylist,getUserPlaylist,getPlaylistById,updatePlaylist,addVideoPlaylist,removeVideoFromPlaylist} from "../controllers/playlist.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/getplay-byUid/:userId").get(getUserPlaylist);
router.route("/getplay-byid/:playlistId").get(getPlaylistById);

//secure routes
router.route("/create").post(verifyJWT, createPlaylist);
router.route("/delete/:playId").delete(verifyJWT, deletePlaylist);
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);
router.route("/add-video/:playlistId/:videoId").patch(verifyJWT, addVideoPlaylist);
router.route("/remove-video/:playId/:videoId").patch(verifyJWT, removeVideoFromPlaylist);

export default router;