import {Router} from "express";
import { logoutUser, refreshAccessToken, registerUser, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { User } from "../models/User.models.js";
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

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

export default userRouter;