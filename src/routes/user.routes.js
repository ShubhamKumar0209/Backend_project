import {Router} from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { User } from "../models/User.models.js";

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

export default userRouter;