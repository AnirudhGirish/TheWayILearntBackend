import {Router} from "express";
import {addTweet,deleteTweet,getUserTweets,updateTweet} from "../controllers/tweet.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/get-tweets").get(getUserTweets);
router.route("/add").post(addTweet);
router.route("/delete/:tweetId").delete(deleteTweet);
router.route("/update/:tweetId").patch(updateTweet);

export default router;