import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv"
import { ApiError } from './apiError.js';

dotenv.config()
// configure cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY , 
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload
        (
            localFilePath,
            {
            resource_type: "auto"
            }
        )
        console.log(`File uploaded on cloudinary . File src : ${response.url}`)
        // as the file is uploaded to cloud storage, would like to delete it from server disk storage
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        fs.unlink(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (publicId)=>{
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from cloudinary for PublicId",publicId);
    } catch (error) {
        console.log("Error deleting from cloudinary",error);
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}