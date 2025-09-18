import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import APIError from "./APIError.js";
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const uploadOnCloudinary= async(localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        
        // console.log("File has been successfully uploaded on cloudinary ",response.url);
    fs.unlinkSync(localFilePath)
    // Remove sensitive info if present
    const { api_key, api_secret, ...safeResponse } = response;
    return safeResponse;
    }
    catch(error){
        console.error("Cloudinary upload error:", error);
        fs.unlinkSync(localFilePath)
        //remove the locally saved file as the upload got failed and sync as we want to delete it before moving forward
        return null
    }

}


const deleteFromCloudinary=async(oldImageUrl)=>{
    try{
        if(!oldImageUrl) throw new APIError(500,"Could not fetch oldImageUrl");
        const publicIdMatch = oldImageUrl.match(/\/v\d+\/(.+)\.\w+$/);
        if(!publicIdMatch|| !publicIdMatch[1]) throw new APIError(500,"Could not extract public ID from URL:", oldImageUrl);
         const publicId = publicIdMatch[1];
        const result=await cloudinary.uploader.destroy(publicId);
        return result;
    }
    catch(err)
    {
        console.error("Cloudinary destroy error: ",err);
        return null;
    }
}

export  {
    uploadOnCloudinary,deleteFromCloudinary
}