import {Router} from "express";
import { changePassWord, getCurrentUser, getUserChannelProfile, getWatchHistory, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { User } from "../models/User.models.js";
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verify } from "jsonwebtoken";

const userRouter=Router();

userRouter.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

userRouter.route("/login").post(loginUser)
//secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/updateUserAvatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

userRouter.route("/updateCoverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

userRouter.route("/changePassword").post(verifyJWT,changePassWord);

userRouter.route("/getCurrentUser").get(verifyJWT,getCurrentUser)

userRouter.route("/updateDetails").patch(verifyJWT,updateAccountDetails);
//get is used since user is not updating anything
//post is used when user is updating something
userRouter.route("/c/:username").get(verifyJWT,getUserChannelProfile);

userRouter.route("/watchHistory").get(verifyJWT,getWatchHistory) 

export default userRouter;