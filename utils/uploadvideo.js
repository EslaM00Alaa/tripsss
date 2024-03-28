const multer = require("multer"),
  path = require("path");


const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../videos"));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  // Create multer middleware specifically for videos
  const videoUpload = multer({
    storage: videoStorage,
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith("video")) {
        cb(null, true);
      } else {
        cb({ message: "Unsupported video format" }, false);
      }
    },
    limits: { fileSize: 1024 * 1024 * 500 } // 500 MB limit for videos
  });
  
  module.exports = {
    videoUpload: videoUpload
  };