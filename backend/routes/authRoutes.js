
const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// Authentication rate limiters
const {
  signupLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  profileOtpLimiter,
  verifyProfileOtpLimiter,
} = require("../middleware/authRateLimiter");

// Signup
router.post(
  "/signup",
  signupLimiter,
  upload.single("profile_image"),
  authController.signup,
);

// Login
router.post(
  "/login",
  loginLimiter,
  authController.login,
);

// Forgot password
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword,
);

// Verify password reset OTP
router.post(
  "/verify-otp",
  verifyOtpLimiter,
  authController.verifyOtp,
);

// Reset password
router.post(
  "/reset-password",
  resetPasswordLimiter,
  authController.resetPassword,
);

// Send profile update OTP
router.post(
  "/send-profile-update-otp",
  profileOtpLimiter,
  authMiddleware,
  authController.sendProfileUpdateOtp,
);

// Verify OTP and update profile
router.put(
  "/verify-profile-update-otp",
  verifyProfileOtpLimiter,
  authMiddleware,
  upload.single("profile_image"),
  authController.verifyProfileUpdateOtp,
);

module.exports = router;
