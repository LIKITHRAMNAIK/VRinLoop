
const { rateLimit } = require("express-rate-limit");

const WINDOW_MS = 15 * 60 * 1000;

// Common rate limiter configuration
const createLimiter = (
  limit,
  message,
  skipSuccessfulRequests = false
) => {
  return rateLimit({
    windowMs: WINDOW_MS,

    limit,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    skipSuccessfulRequests,

    message: {
      success: false,
      message,
    },
  });
};

// Signup: 5 requests per 15 minutes
const signupLimiter = createLimiter(
  5,
  "Too many signup requests. Please try again later."
);

// Login: 10 failed attempts per 15 minutes
const loginLimiter = createLimiter(
  10,
  "Too many login attempts. Please try again after 15 minutes.",
  true
);

// Forgot password: 5 requests per 15 minutes
const forgotPasswordLimiter = createLimiter(
  5,
  "Too many password recovery requests. Please try again later."
);

// Verify OTP: 10 requests per 15 minutes
const verifyOtpLimiter = createLimiter(
  10,
  "Too many OTP verification attempts. Please try again later."
);

// Reset password: 5 requests per 15 minutes
const resetPasswordLimiter = createLimiter(
  5,
  "Too many password reset requests. Please try again later."
);

// Send profile OTP: 5 requests per 15 minutes
const profileOtpLimiter = createLimiter(
  5,
  "Too many profile OTP requests. Please try again later."
);

// Verify profile OTP: 10 requests per 15 minutes
const verifyProfileOtpLimiter = createLimiter(
  10,
  "Too many profile verification attempts. Please try again later."
);

module.exports = {
  signupLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  profileOtpLimiter,
  verifyProfileOtpLimiter,
};
