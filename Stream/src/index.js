import {app} from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path:"./.env"
}) // env path config 

const PORT = process.env.PORT || 3000 //port

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server has spun up and is running on port ${PORT}`);
    }) // listener end point of the server
})
.catch((err)=>{
        console.log("MongoDB connection error ",err);
    }
)

