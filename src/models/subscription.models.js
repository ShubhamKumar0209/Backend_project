import mongoose from "mongoose";

const subscriptionSchema=new mongoose.Schema({
    subscribe:{
        type:Schema.Types.Object.Id,
        //The person who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.Object.Id,
        //One who is being subscribed
        ref:"User"
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema);