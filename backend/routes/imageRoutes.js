const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getPrivateImage,
} = require("../controllers/imageController");

const router = express.Router();

// Prevent caching, including authentication error responses
router.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  next();
});

// Authenticated private image access
router.get(
  "/:filename",
  authMiddleware,
  getPrivateImage,
);

module.exports = router;