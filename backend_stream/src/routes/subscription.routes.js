import {Router} from "express";
import {getSubscribedChannels,getUserChannelSubscribers,toggleSubscription} from "../controllers/subscription.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle-Subscribe/:channelId").post(toggleSubscription);
router.route("/get-subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/get-subscriptions/:subscriberId").get(getSubscribedChannels);

export default router;