import { User } from "../models/User.models.js";
import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";

const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation-not empty
    //check if user already exists:through username or email
    //check if for images, check for avatar
    //upload them to cloudinary,check avatar is required
    //create user object- create entry in db
    //remove password and refrshtoken field from response
    //check for user creation
    //return res

    const {username,email,fullname,password}=req.body;
    console.log("email",email);
    if([fullname,email,username,password].some((field)=>
    {
        field?.trim()===""
    }))
    {
        throw new APIError(400,"All fields are required" )
    }
    const existingUser= await User.findOne({
        $or:[{username},{email}]
        //if either username or email matches
    })

    if(existingUser) throw new APIError(409,"User already exists with this username or email");

    //this req.file is coming from multer middleware
    //since we are uploading multiple files, so req.files
    console.log(req.files);
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0  )
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }
    if(!avatarLocalPath) throw new APIError(400,"Avatar file is required")

    // console.log("avatarLocalPath:", avatarLocalPath);
    const normalizedPath = avatarLocalPath.replace(/\\/g, "/");
    const avatar = await uploadOnCloudinary(normalizedPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    console.log("avatar",avatar);   

    if(!avatar) throw new APIError(500,"Failed to upload avatar image, please try again later") ;
    // console.log("avatar upload result:", avatar);
    //cover image is optional

    const user =await User.create(
        {
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url||"",
            email,
            password,
            username:username.toLowerCase()
        }
    )

    //To check creation of user but extra database call and if we have to return user details without password and refresh token
    //we can use select method to exclude those fields with '-' sign
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) throw new APIError(500,"Failed to create user, please try again later");

    return res.status(201).json( new APIResponse(200,createdUser,"User registered successfully"))

})
export default registerUser;