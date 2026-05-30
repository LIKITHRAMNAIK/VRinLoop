const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const upload = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", upload.single("profile_image"), authController.signup);

router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);

router.post("/verify-otp", authController.verifyOtp);

router.post("/reset-password", authController.resetPassword);

router.put(
  "/update-profile",
  authMiddleware,

  upload.single("profile_image"),

  authController.updateProfile,
);

router.post(
  "/send-profile-update-otp",

  authMiddleware,

  authController.sendProfileUpdateOtp,
);

router.put(
  "/verify-profile-update-otp",

  authMiddleware,

  upload.single("profile_image"),

  authController.verifyProfileUpdateOtp,
);

module.exports = router;
