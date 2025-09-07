import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; 
// To access cookies from server to browser and set cookies in the request and response objects. Basically cred operation
const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}));

//We are accepting json data in the request body
app.use(express.json({limit:"16kb"}))
//We are accepting req body in urlencoded form and extended true means we are accepting nested objects 
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//We are accepting public assets like images,pdfs etc in the request
app.use(express.static("public"))
app.use(cookieParser());
//cookieParser middleware should be used after express session if we are using express session 
export default app;