import { User } from "../models/User.models.js";
import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import { verifyJWT } from "../middleware/auth.middleware.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new APIError(500, "Something went wrong while generating tokens");
    }
}



const registerUser = asyncHandler(async (req, res) => {

    //get user details from frontend
    //validation-not empty
    //check if user already exists:through username or email
    //check if for images, check for avatar
    //upload them to cloudinary,check avatar is required
    //create user object- create entry in db
    //remove password and refrshtoken field from response
    //check for user creation
    //return res

    const { username, email, fullname, password } = req.body;
    console.log("email", email);
    if ([fullname, email, username, password].some((field) => {
        field?.trim() === ""
    })) {
        throw new APIError(400, "All fields are required")
    }
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
        //if either username or email matches
    })

    if (existingUser) throw new APIError(409, "User already exists with this username or email");

    //this req.file is coming from multer middleware
    //since we are uploading multiple files, so req.files
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) throw new APIError(400, "Avatar file is required")

    // console.log("avatarLocalPath:", avatarLocalPath);
    const normalizedPath = avatarLocalPath.replace(/\\/g, "/");
    const avatar = await uploadOnCloudinary(normalizedPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("avatar", avatar);

    if (!avatar) throw new APIError(500, "Failed to upload avatar image, please try again later");
    // console.log("avatar upload result:", avatar);
    //cover image is optional

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )

    //To check creation of user but extra database call and if we have to return user details without password and refresh token
    //we can use select method to exclude those fields with '-' sign
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) throw new APIError(500, "Failed to create user, please try again later");

    return res.status(201).json(new APIResponse(200, createdUser, "User registered successfully"))

})

const loginUser = asyncHandler(async (req, res) => {

    //req body->data
    //username or email based access
    //find the user
    //validation
    //access and refresh token
    //send cookies
    const { email, username, password } = req.body;
    if (!username && !email) throw new APIError(400, "Username or email is required to login");
    //find user based on username or email
    //these findOne or find methods are mongoDB methods and can be  accessed through User not user.  
    const user = await User.findOne(
        username
            ? { username }
            : { email }
    );
    if (!user) throw new APIError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new APIError(401, "Invalid Password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    //since it will take time to generate tokens because db call is involved

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new APIResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) => {
    //clear cookies
    //delete refresh token from db
    //send response

    //working:While going meet me

    //since we executed a authMiddleware before this so now we have access to req.user
    await User.findByIdAndUpdate(req.user._id, {
        //$set is a mongoDB operator
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )
    // we need options to clear cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    //cookies name should be same 
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIResponse(200, {}, "User logged Out"))


})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // we can get the refresh token of active user from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) throw new APIError(401, "unauthorized request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        if (!user) throw new APIError("Invalid Refresh Token");
    
        //validate refresh token
        if (incomingRefreshToken !== user.refreshToken) throw new APIError(401, "Refres token is expired or used")
    
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };
        const{accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(200,{accessToken,refreshToken:newRefreshToken},"Access Token refreshed");
    } catch (error) {
        throw new APIError(401,error?.message || "Invalid refresh token")
    }

})

const changePassWord=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect)
        throw new APIError(400,"Invalid Old password");
    user.password=newPassword;
    await user.save({validateBeforeSave:false})
    return res.
    status(200)
    .json(new APIResponse(200,{},"Password changed successfully"))

    //What we did is, basically took the old and new password from user, validated user's oldPassword and if it is correct then updated the password and saved. We dont need to verify if the user is logged in or not, since we can use middleware for that.
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"Current User fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email) throw new APIError(400,"All fields are required");
    const user=await User.findByIdAndUpdate(req.user?._id,
    {new: true} //values that are new are returned
    ,
    {
        $set:{
            fullname:fullname,
            email:email
        }
    }
    ).select("-password")
    //we can do chaining like this to avoid one more database hit
    return res
    .status(200)
    .json(new APIResponse(200,user,"Account details updated successfully"));

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath) throw new APIError(400,"Avatar file is missing");
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) throw new APIError(400,"Error while uploading on avatar");
    
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.url}}).select("-password");
    // we removed new:true, so that we can get the old url to delete
    const oldAvatarUrl=user.avatar;
    if(oldAvatarUrl) await deleteFromCloudinary(oldAvatarUrl);
    //Now we will update the new AvatarUrl manually though the value in database has been updated the only thing is 'user' variable will contain old value so we need to update it manually before responding;
    user.avatar=avatar.url;


    return res
    .status(200)
    .json(new APIResponse(200,user,"Avatar Image updated successfully"));
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath) throw new APIError (400,"Cover image is missing");
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage) throw new APIError(400,"Error while uploading cover image");
    const user=await User.findByIdAndUpdate(req.user?._id,{new :true},{$set:{coverImage:coverImage.url}}).select("-password");

    return res
    .status(200)
    .json(new APIResponse(200,user,"Cover Image updated successfully"));

})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()) throw new APIError(400,"Username is missing");
    const channel=await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedTo:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    //since this is an aggregate, it will return an array
    if(!channel?.length) throw new APIError(404,"Channel does not exist");
    return res
    .status(200)
    .json(new APIResponse(200,channel[0],"Channel details fetched successfully"));
})

export {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changePassWord,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};