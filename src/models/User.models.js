import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
        //to make it faster to search
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        //cloudinary url for image
        required:true,

    },
    coverImage:{
        type:String,
        //cloudinary url for image
    },
    watchHistory:[
            {
                type:mongoose.Schema.ObjectId,
                ref:"Video"
            }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true});//to automatically add createdAt and updatedAt fields

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10)
    next();
})
//async, since it takes time to hash the password
// can't use ()=>{} because we need to access this keyword for constant

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
    //await, since cryptography takes time, compute intensive
}

//Access token is short lived (1d,2d etc.)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

//Refresh token is saved in db so that when access token expires, it can be renewed using this refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export const User=mongoose.model("User",userSchema);