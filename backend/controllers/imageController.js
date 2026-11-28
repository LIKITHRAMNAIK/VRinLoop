const path = require("path");
const fs = require("fs/promises");

const User = require("../models/User");
const Feedback = require("../models/Feedback");

const uploadDirectory = path.join(
  __dirname,
  "..",
  process.env.NODE_ENV === "test"
    ? "uploads-test"
    : "uploads",
);

const allowedFilename =
  /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i;

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

exports.getPrivateImage = async (req, res) => {
  // Prevent caching of private images and error responses
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  try {
    const userId = req.user?.id;
    const filename = req.params.filename;

    // Additional authentication safeguard
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Strict filename validation
    if (
      typeof filename !== "string" ||
      filename.length > 255 ||
      !allowedFilename.test(filename)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image filename",
      });
    }

    // Check profile image ownership
    const ownsProfileImage = await User.exists({
      _id: userId,
      profile_image: filename,
    });

    // Check feedback image ownership
    const ownsFeedbackImage = ownsProfileImage
      ? false
      : await Feedback.exists({
          user: userId,
          image: filename,
        });

    // Do not reveal whether another user's image exists
    if (!ownsProfileImage && !ownsFeedbackImage) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const filePath = path.join(
      uploadDirectory,
      filename,
    );

    // Reject symbolic links and non-regular files
    const fileStats = await fs.lstat(filePath);

    if (
      fileStats.isSymbolicLink() ||
      !fileStats.isFile()
    ) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Verify the resolved file remains inside the upload directory
    const realDirectory = await fs.realpath(
      uploadDirectory,
    );

    const realFilePath = await fs.realpath(
      filePath,
    );

    if (
      path.dirname(realFilePath) !== realDirectory
    ) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const extension = path
      .extname(filename)
      .toLowerCase();

    res.setHeader(
      "Content-Type",
      contentTypes[extension],
    );

    // Send the authorised private image
    return res.sendFile(
      realFilePath,
      {
        cacheControl: false,
        lastModified: false,
        acceptRanges: false,
        dotfiles: "deny",
      },
      (error) => {
        if (!error) return;

        if (res.headersSent) {
          res.destroy();
          return;
        }

        if (
          error.code === "ENOENT" ||
          error.status === 404
        ) {
          return res.status(404).json({
            success: false,
            message: "Image not found",
          });
        }

        console.error(
          "Private image delivery failed:",
          error.code || error.name,
        );

        return res.status(500).json({
          success: false,
          message: "Unable to load image",
        });
      },
    );
  } catch (error) {
    if (
      error.code === "ENOENT" ||
      error.code === "ENOTDIR"
    ) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    console.error(
      "Private image access failed:",
      error.code || error.name,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load image",
    });
  }
};