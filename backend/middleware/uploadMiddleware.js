
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Separate production and test upload directories
const uploadDirectory = path.join(
  __dirname,
  "..",
  process.env.NODE_ENV === "test" ? "uploads-test" : "uploads"
);

// Create directory if it does not exist
fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

// Allowed image types
const allowedImageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const extension = allowedImageTypes[file.mimetype];

    const filename =
      Date.now() +
      "-" +
      crypto.randomUUID() +
      extension;

    cb(null, filename);
  },
});

// Restrict uploaded file types
const fileFilter = (req, file, cb) => {
  if (
    !Object.prototype.hasOwnProperty.call(
      allowedImageTypes,
      file.mimetype
    )
  ) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }

  cb(null, true);
};

// Secure upload configuration
const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
