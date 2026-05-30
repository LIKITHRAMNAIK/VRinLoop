const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const feedbackController = require("../controllers/feedbackController");

router.post(
  "/submit",

  authMiddleware,

  upload.single("image"),

  feedbackController.submitFeedback,
);

module.exports = router;
