const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");

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

const allowedImageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Image security limits
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 6000;
const MAX_IMAGE_HEIGHT = 6000;
const MAX_IMAGE_PIXELS = 20_000_000;

// Limit simultaneous upload requests
const MAX_CONCURRENT_UPLOADS = 2;
const UPLOAD_TIMEOUT_MS = 60 * 1000;
const IMAGE_PROCESSING_TIMEOUT_SECONDS = 15;

let activeUploads = 0;
// Expected actual image formats
const allowedImageFormats = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

// Reject animated PNG images using actual PNG chunk boundaries
const validateStaticPNG = (buffer) => {
  const pngSignature = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);

  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 8 ||
    !buffer.subarray(0, 8).equals(pngSignature)
  ) {
    throw new Error("Invalid PNG signature.");
  }

  let offset = 8;

  while (offset < buffer.length) {
    // Each PNG chunk requires length, type and CRC fields
    if (buffer.length - offset < 12) {
      throw new Error("Invalid PNG chunk structure.");
    }

    const chunkLength = buffer.readUInt32BE(offset);

    const chunkType = buffer.toString(
      "ascii",
      offset + 4,
      offset + 8
    );

    const chunkEnd = offset + 12 + chunkLength;

    if (chunkEnd > buffer.length) {
      throw new Error("Invalid PNG chunk length.");
    }

    // Reject animation-related PNG chunks
    if (
      chunkType === "acTL" ||
      chunkType === "fcTL" ||
      chunkType === "fdAT"
    ) {
      throw new Error("Animated PNG images are not allowed.");
    }

    if (chunkType === "IEND") {
      if (chunkLength !== 0 || chunkEnd !== buffer.length) {
        throw new Error("Invalid PNG ending.");
      }

      return;
    }

    offset = chunkEnd;
  }

  throw new Error("Missing PNG ending.");
};

// Validate actual image format
const validateImageFormat = async (file) => {
  const expectedFormat = allowedImageFormats[file.mimetype];

  if (!expectedFormat) {
    throw new Error("Unsupported image format.");
  }

  const metadata = await sharp(file.buffer, {
    limitInputPixels: MAX_IMAGE_PIXELS,
    failOn: "warning",
  }).metadata();

  if (metadata.format !== expectedFormat) {
    throw new Error(
      "Actual image format does not match the uploaded file type."
    );
  }

  // Reject animated PNG images
if (metadata.format === "png") {
  validateStaticPNG(file.buffer);
}

    // Validate image dimensions
  if (
    !Number.isInteger(metadata.width) ||
    !Number.isInteger(metadata.height) ||
    metadata.width <= 0 ||
    metadata.height <= 0 ||
    metadata.width > MAX_IMAGE_WIDTH ||
    metadata.height > MAX_IMAGE_HEIGHT ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(
      "Image dimensions exceed the allowed limits."
    );
  }

  // Reject animated or multi-page images
  if ((metadata.pages ?? 1) > 1) {
    throw new Error(
      "Animated or multi-page images are not allowed."
    );
  }

    return metadata;
};

// Decode and securely re-encode uploaded images
const sanitizeImage = async (file) => {
  const metadata = await validateImageFormat(file);

  const image = sharp(file.buffer, {
  limitInputPixels: MAX_IMAGE_PIXELS,
  failOn: "warning",
})
  .rotate()
  .timeout({
    seconds: IMAGE_PROCESSING_TIMEOUT_SECONDS,
  });

  let sanitizedBuffer;

  switch (metadata.format) {
    case "jpeg":
      sanitizedBuffer = await image
        .jpeg({ quality: 90 })
        .toBuffer();
      break;

    case "png":
      sanitizedBuffer = await image
        .png({ compressionLevel: 6 })
        .toBuffer();
      break;

    case "webp":
      sanitizedBuffer = await image
        .webp({ quality: 90 })
        .toBuffer();
      break;

    default:
      throw new Error("Unsupported image format.");
  }

  // Validate processed image size
  if (
    sanitizedBuffer.length === 0 ||
    sanitizedBuffer.length > MAX_FILE_SIZE
  ) {
    throw new Error(
      "Processed image must not exceed 5 MB."
    );
  }

  return sanitizedBuffer;
};

// Save only validated and sanitized images
const saveSanitizedImage = async (file) => {
  const sanitizedBuffer = await sanitizeImage(file);

  const extension = allowedImageTypes[file.mimetype];

  const filename =
    Date.now() +
    "-" +
    crypto.randomUUID() +
    extension;

  const filePath = path.join(uploadDirectory, filename);

  // Create a new file without overwriting existing files
const fileHandle = await fs.promises.open(
  filePath,
  "wx",
  0o600
);

try {
  try {
    await fileHandle.writeFile(sanitizedBuffer);
  } finally {
    await fileHandle.close();
  }
} catch (error) {
  // Remove incomplete files created by this request
  try {
    await fs.promises.unlink(filePath);
  } catch (cleanupError) {
    if (cleanupError.code !== "ENOENT") {
      console.error(
        "Image cleanup failed:",
        cleanupError.code
      );
    }
  }

  throw error;
}

  // Restore disk-based properties required by controllers
  file.destination = uploadDirectory;
  file.filename = filename;
  file.path = filePath;
  file.size = sanitizedBuffer.length;

  // Release the original uploaded buffer
  delete file.buffer;

  return file;
};

// Storage configuration
// Temporarily hold uploaded files in memory
// Only validated and sanitized images will be saved to disk
const storage = multer.memoryStorage();

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
  fileSize: MAX_FILE_SIZE,
  files: 1,
  fields: 10,
  fieldSize: 32 * 1024,
  fieldNameSize: 100,
  parts: 11,
  headerPairs: 100,
},
});

// Validate and sanitize uploaded images before controllers run
const secureUpload = {
  single: (fieldName) => {
    const uploadSingle = upload.single(fieldName);

    return (req, res, next) => {
      if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
        return res.status(503).json({
          success: false,
          message:
            "Upload service is busy. Please try again shortly.",
        });
      }

      activeUploads += 1;

      let slotReleased = false;
      let processingStarted = false;
      let requestInterrupted = false;
let uploadTimer = null;

const clearUploadTimer = () => {
  if (uploadTimer !== null) {
    clearTimeout(uploadTimer);
    uploadTimer = null;
  }
};

      // Release each upload slot only once
      const releaseUploadSlot = () => {
        if (!slotReleased) {
          slotReleased = true;
          activeUploads -= 1;
        }
      };

      // Track interrupted connections
      const handleInterruptedRequest = () => {
  requestInterrupted = true;
  clearUploadTimer();

        if (!processingStarted) {
          releaseUploadSlot();
        }
      };

      const handleResponseClose = () => {
        if (!res.writableFinished) {
          handleInterruptedRequest();
        }
      };

      req.once("aborted", handleInterruptedRequest);
      res.once("close", handleResponseClose);

// Restrict total upload receiving time
uploadTimer = setTimeout(() => {
  if (!processingStarted && !slotReleased) {
    handleInterruptedRequest();

    // Terminate the stalled upload connection
    req.destroy();
  }
}, UPLOAD_TIMEOUT_MS);

try {
        uploadSingle(req, res, async (error) => {
          processingStarted = true;
clearUploadTimer();

          try {
            if (
              requestInterrupted ||
              req.aborted ||
              res.destroyed
            ) {
              return;
            }

            // Handle Multer upload errors
            if (error) {
              return res.status(400).json({
                success: false,
                message:
                  error.code === "LIMIT_FILE_SIZE"
                    ? "Image must not exceed 5 MB."
                    : "Invalid image upload.",
              });
            }

            // Validate and securely store optional images
            if (req.file) {
              await saveSanitizedImage(req.file);
            }

            // Remove images from interrupted requests
            if (
              requestInterrupted ||
              req.aborted ||
              res.destroyed
            ) {
              if (req.file?.path) {
                try {
                  await fs.promises.unlink(req.file.path);
                } catch (cleanupError) {
                  if (cleanupError.code !== "ENOENT") {
                    console.error(
                      "Interrupted upload cleanup failed:",
                      cleanupError.code
                    );
                  }
                }
              }

              return;
            }
          } catch (imageError) {
            console.error(
              "Image processing failed:",
              imageError.name
            );

            if (!req.aborted && !res.destroyed) {
              return res.status(400).json({
                success: false,
                message:
                  "Invalid or unsupported image, or image could not be processed.",
              });
            }

            return;
          } finally {
            if (req.file) {
              delete req.file.buffer;
            }

            req.removeListener(
              "aborted",
              handleInterruptedRequest
            );

            res.removeListener(
              "close",
              handleResponseClose
            );

            releaseUploadSlot();
          }

          return next();
        });
      } catch (uploadError) {
  clearUploadTimer();

  req.removeListener(
          "aborted",
          handleInterruptedRequest
        );

        res.removeListener(
          "close",
          handleResponseClose
        );

        releaseUploadSlot();

        return next(uploadError);
      }
    };
  },
};

module.exports = secureUpload;