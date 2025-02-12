import {v2 as cloudinary} from 'cloudinary';
import {extractPublicId} from 'cloudinary-build-url';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            console.log("Require file to upload : MISSING FILE!!!");
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type: "auto"});
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (url)=>{
    try {
        if(!url){
            console.log("Pic Url not found!!!");
        }
        const publicId = extractPublicId(url);

        // console.log(`Attempting to delete pic from Cloudinary: ${publicId}`);

        const result = await cloudinary.uploader.destroy(publicId);

        // console.log("Deleted from cloudinary for PublicId",publicId);
        // console.log("Cloudinary result:", result);
        // if (result.result !== 'ok') {
        //     console.log("Failed to delete file from Cloudinary.");
        // } //TODO : not todo fixed using logs

    } catch (error) {
        console.log("Error deleting from cloudinary",error);
        return null
    }
}

const uploadVideoOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Require file to upload: MISSING FILE!!!");
            return null;
        }

        // Upload video with eager transformation to HLS
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video",
            eager: [
                { format: 'mp4' },
                { transformation: [{ width: 720, height: 1280, crop: 'limit' }] },
                { format: 'm3u8' }  // HLS
            ]
        });

        fs.unlinkSync(localFilePath);  // Delete local file after upload
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("Error uploading video to Cloudinary", error);
        return null;
    }
}

const deleteVideoFromCloudinary = async (url) => {
    // console.log("Video URL for deletion:", url);

    try {
        if (!url) {
            console.log("Video Url not found!!!");
            return;
        }

        const publicId = extractPublicId(url);
        // console.log(`Attempting to delete video from Cloudinary: ${publicId}`);
        const result = await cloudinary.api.delete_resources([publicId], { resource_type: "video" });

        // console.log("Cloudinary delete result:", result);
        // if (result.deleted && result.deleted[publicId] === 'not_found') {
        //     console.log(`File with public ID ${publicId} not found on Cloudinary. Skipping deletion.`);
        // } else if (result.deleted && result.deleted[publicId] === 'deleted') {
        //     console.log(`Successfully deleted from Cloudinary: ${publicId}`);
        // } else {
        //     console.log(`Error: Failed to delete file from Cloudinary.`);
        // }

    } catch (error) {
        console.log("Error deleting from Cloudinary:", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary, uploadVideoOnCloudinary, deleteVideoFromCloudinary };