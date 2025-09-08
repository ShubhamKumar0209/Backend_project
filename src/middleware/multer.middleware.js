import multer from 'multer';

// We can use memory storage also but here we are using disk storage for temporary storage since we will upload to cloudinary immediately after that and there is a possibility that memory storage can overflow if large files are uploaded
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname);
  }
})

export const upload = multer({ storage: storage })