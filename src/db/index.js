import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

//Database could be in another continent so we need to connect to it so async function
const connectDB=async () =>{
    try{
        //since mongoose.connect returns a promise we will await it and returns an object
    const connectionInstance=await mongoose.connect(process.env.MONGODB_URI);
        console.log(`\nMONGODB connected !! DB HOST: ${connectionInstance.connection.host}`)
        //connectionInstance.connection.host gives the host of the database connected
    }
    catch(error){
        console.log("MONGODB connection FAILED:", error)
        process.exit(1);
        //instead of throwing error we are exiting the process to exit the process with failure

    }
}
export default connectDB;