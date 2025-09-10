import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";

export const verifyJWT=asyncHandler(async(req,_,next)=>{
    //"_" is for res but we are not giving any res in return so _
    // req has cookies access because of cookie parser
    try {
        const token =
            req.cookies?.accessToken ||
            (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
        // console.log("Cookies:", req.cookies);
        // console.log("Authorization header:", req.headers.authorization);
        if (!token || typeof token !== "string") throw new APIError(401,"Unauthorized access");

        const decodedToken= await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
        
        console.log("Extracted token:", token);
        if(!user) throw new APIError(401,"Invalid access token")
        req.user=user;
        next()
    } catch (error) {
        throw new APIError(401,error?.message||"Invalid access token")
    }
    //we used accesstoken to get id from it, now we used that id to find the user details from our db so that we can pass this to logoutUser to delete refreshTokens

    

});
