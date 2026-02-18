const multer = require("multer");
const path = require("path");

// Define where and how to store the files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensuring it points to your 'uploads' folder
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Format: 17123456789.jpg
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to ensure only medical documents are uploaded
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg, .jpeg, and .pdf formats are allowed!"));
  }
};

module.exports = multer({
  storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB as high-res reports can be large
});