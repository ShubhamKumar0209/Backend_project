import mongoose,{Schema} from "mongoose";;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema=new Schema({
    videoFile:{
        type:String,//cloudinary url for video
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        //from cloudinary response
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    }

},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate);


export const Video=mongoose.model("Video",videoSchema);