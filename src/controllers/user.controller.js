import { User } from "../models/User.models.js";
import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";

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
export {
    loginUser,
    registerUser,
    logoutUser
};