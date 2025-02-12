import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

// Rate Limiter Setup: Global rate limit of 100 requests per 15 minutes
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Max requests per IP within the 15-minute window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,  // Provides rate limit info in RateLimit-* headers
    legacyHeaders: false,   // Disables the X-RateLimit-* headers
});

app.use(helmet());  // Secure HTTP headers
app.use(cookieParser());  // Parse cookies
app.use(globalRateLimiter);  // Apply rate limiting
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));  // Serve static files

//Routes Importing
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

//Routes Declatration
// http://localhost:8000/api/v1/{route} we come to this firstly then in user router we continue 
app.use("/api/v1/comment", commentRouter); 
app.use("/api/v1/dashboard", dashboardRouter); 
app.use("/api/v1/healthCheck", healthCheckRouter); 
app.use("/api/v1/like", likeRouter); 
app.use("/api/v1/playlist", playlistRouter); 
app.use("/api/v1/subscription", subscriptionRouter); 
app.use("/api/v1/tweet", tweetRouter); 
app.use("/api/v1/users", userRouter); 
app.use("/api/v1/video", videoRouter); 

export { app } 