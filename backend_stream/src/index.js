import connectDB from "./db/index.db.js";
import dotenv from "dotenv";
import { app } from "./app.js";
// need to import and configure dotenv
//require('dotenv').config({path:'./env'}) //but this messes up the code consistency so

dotenv.config({
    path:'./.env',
});

connectDB()
.then(()=>{
    app.on("Error", (error)=>{
        console.log(`Error from express server : ${error}`);
    })
    app.listen(process.env.PORT || 8001,() => 
    {
        console.log(`The backend server is up working and serving on port ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.log(`MONGODB connection failed!!! Error : ${error} `);
})


// const app = express();

// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (error)=>{
//             console.log(`Error from express couldnt connect to DB: ${error}`);
//             throw error;
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`Backend is up and serving on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error(`Error connecting to DB : ${error}`)
//         throw error
//     }
// })() this is one approach using IIFE immediatly invoked function expression but pollutes index.js so will do it in db folder