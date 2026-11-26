
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");

// Security Configuration
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// Generate a cryptographically secure 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Protect OTP using keyed hashing
const hashOtp = (otp, userId, purpose) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(JSON.stringify(["otp", String(userId), purpose, otp]))
    .digest("hex");
};

// Generate a secure password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash password reset token before database storage
const hashResetToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

// Safely compare hashed values
const secureCompare = (first, second) => {
  if (typeof first !== "string" || typeof second !== "string") {
    return false;
  }

  if (!first || !second) {
    return false;
  }

  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
};

// Return only safe user information
const getSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profile_image: user.profile_image,
});



exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate name
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name is required",
      });
    }

    // Validate email
    if (
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    // Validate phone number
    if (
      typeof phone !== "string" ||
      !/^\+?[\d\s()-]{7,20}$/.test(phone.trim()) ||
      phone.replace(/\D/g, "").length < 7 ||
      phone.replace(/\D/g, "").length > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    // Validate password
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters and must not exceed 72 bytes.",
      });
    }

    // Normalize profile details
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    // Check existing email
    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    const profile_image = req.file
      ? req.file.filename
      : "";

    // Create user
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      profile_image,
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: getSafeUser(user),
    });
  } catch (error) {
    // Handle concurrent duplicate registrations
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    console.error("Signup Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Signup failed. Please try again.",
    });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
  email: email.trim(),
}).select("+password +password_changed_at");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
  {
    id: user._id,

    pwdChangedAt: user.password_changed_at
      ? user.password_changed_at.getTime()
      : 0,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
    algorithm: "HS256",
  },
);

    res.json({
      success: true,
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const user = await User.findOne({
      email: email.trim(),
    });

    // Generic response to prevent account enumeration
    const successResponse = {
      success: true,
      message: "If the email is registered, an OTP will be sent.",
    };

    if (!user) {
      return res.json(successResponse);
    }

    const now = Date.now();
    const otp = generateOtp();

    const hashedOtp = hashOtp(
      otp,
      user._id,
      "password_reset",
    );

    // Atomically enforce OTP resend cooldown
const updatedUser = await User.findOneAndUpdate(
  {
    _id: user._id,
    email: user.email,

    $or: [
          { otp_last_sent: { $exists: false } },
          { otp_last_sent: null },
          {
            otp_last_sent: {
              $lte: new Date(now - OTP_RESEND_COOLDOWN_MS),
            },
          },
        ],
      },
      {
        $set: {
          otp: hashedOtp,
          otp_expiry: new Date(now + OTP_EXPIRY_MS),
          otp_attempts: 0,
          otp_last_sent: new Date(now),
          password_reset_token_hash: "",
        },

        $unset: {
          password_reset_token_expiry: "",
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!updatedUser) {
      return res.json(successResponse);
    }

    try {
      const emailSent = await sendMail(
        user.email,
        "VRinLoop Password Reset OTP",
        `
          <h2>Your OTP Code</h2>
          <h1>${otp}</h1>
          <p>Valid for 10 minutes</p>
        `,
      );

      if (emailSent !== true) {
        throw new Error("OTP email request failed");
      }
    } catch (mailError) {
      // Invalidate the OTP if the email request fails
      await User.updateOne(
        {
          _id: user._id,
          otp: hashedOtp,
          otp_last_sent: new Date(now),
        },
        {
          $set: {
            otp: "",
            otp_attempts: 0,
          },

          $unset: {
            otp_expiry: "",
          },
        },
      );

      console.error("Password Reset Email Error:", mailError.message);
    }

    return res.json(successResponse);
  } catch (error) {
    console.error("Forgot Password Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process request. Please try again.",
    });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and 6-digit OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.trim(),
    }).select("+otp +otp_expiry +otp_attempts");

    if (
      !user ||
      !user.otp ||
      !user.otp_expiry ||
      user.otp_expiry.getTime() <= Date.now() ||
      (user.otp_attempts || 0) >= MAX_OTP_ATTEMPTS
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Request a new OTP.",
      });
    }

    const hashedOtp = hashOtp(
      otp,
      user._id,
      "password_reset",
    );

    const otpFilter = {
      _id: user._id,
      email: user.email,
      otp: user.otp,
      otp_expiry: { $gt: new Date() },
      otp_attempts: { $lt: MAX_OTP_ATTEMPTS },
    };

    if (!secureCompare(hashedOtp, user.otp)) {
      const updatedUser = await User.findOneAndUpdate(
        otpFilter,
        {
          $inc: {
            otp_attempts: 1,
          },
        },
        {
          returnDocument: "after",
        },
      ).select("+otp_attempts");

      if (!updatedUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP. Request a new OTP.",
        });
      }

      const remainingAttempts = Math.max(
        0,
        MAX_OTP_ATTEMPTS - updatedUser.otp_attempts,
      );

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Maximum OTP attempts reached. Request a new OTP.",
      });
    }

    const resetToken = generateResetToken();

    const hashedResetToken = hashResetToken(resetToken);

    const verifiedUser = await User.findOneAndUpdate(
      {
        ...otpFilter,
        otp_expiry: { $gt: new Date() },
      },
      {
        $set: {
          otp: "",
          otp_attempts: 0,
          password_reset_token_hash: hashedResetToken,
          password_reset_token_expiry: new Date(
            Date.now() + RESET_TOKEN_EXPIRY_MS,
          ),
        },

        $unset: {
          otp_expiry: "",
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!verifiedUser) {
      return res.status(400).json({
        success: false,
        message: "OTP is no longer valid. Request a new OTP.",
      });
    }

    return res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again.",
    });
  }
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;

    // Validate required fields
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      typeof resetToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(resetToken)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset request",
      });
    }

    // Validate password length
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters and must not exceed 72 bytes.",
      });
    }

    const hashedResetToken = hashResetToken(resetToken);

    const user = await User.findOne({
      email: email.trim(),
      password_reset_token_hash: hashedResetToken,
      password_reset_token_expiry: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new OTP.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Atomically update password and invalidate reset token
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        email: email.trim(),
        password_reset_token_hash: hashedResetToken,
        password_reset_token_expiry: {
          $gt: new Date(),
        },
      },
      {
        $set: {
          password: hashedPassword,
          password_changed_at: new Date(),

          otp: "",
          otp_attempts: 0,

          password_reset_token_hash: "",

          profile_update_otp: "",
          profile_update_otp_attempts: 0,
        },

        $unset: {
          otp_expiry: "",
          password_reset_token_expiry: "",
          profile_update_otp_expiry: "",
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token is no longer valid. Please request a new OTP.",
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password Reset Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Password reset failed. Please try again.",
    });
  }
};



exports.sendProfileUpdateOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = Date.now();

    const otp = generateOtp();

    const hashedOtp = hashOtp(
      otp,
      user._id,
      "profile_update",
    );

    // Atomically enforce OTP resend cooldown
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        email: user.email,

        $or: [
          {
            profile_update_otp_last_sent: {
              $exists: false,
            },
          },
          {
            profile_update_otp_last_sent: null,
          },
          {
            profile_update_otp_last_sent: {
              $lte: new Date(
                now - OTP_RESEND_COOLDOWN_MS,
              ),
            },
          },
        ],
      },
      {
        $set: {
          profile_update_otp: hashedOtp,

          profile_update_otp_expiry: new Date(
            now + OTP_EXPIRY_MS,
          ),

          profile_update_otp_attempts: 0,

          profile_update_otp_last_sent: new Date(now),
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!updatedUser) {
      return res.status(429).json({
        success: false,
        message:
          "Please wait 60 seconds before requesting another OTP.",
      });
    }

    try {
      const emailSent = await sendMail(
        user.email,
        "VRinLoop Profile Update OTP",
        `
          <div style="font-family:sans-serif">
            <h2>Profile Update Verification</h2>
            <p>Use this OTP to verify your profile changes.</p>
            <h1>${otp}</h1>
            <p>Valid for 10 minutes</p>
          </div>
        `,
      );

      if (emailSent !== true) {
        throw new Error("Profile OTP email request failed");
      }
    } catch (mailError) {
      // Invalidate OTP if the email request fails
      await User.updateOne(
        {
          _id: user._id,
          profile_update_otp: hashedOtp,
          profile_update_otp_last_sent: new Date(now),
        },
        {
          $set: {
            profile_update_otp: "",
            profile_update_otp_attempts: 0,
          },

          $unset: {
            profile_update_otp_expiry: "",
          },
        },
      );

      console.error(
        "Profile OTP Email Error:",
        mailError.message,
      );

      return res.status(503).json({
        success: false,
        message:
          "Unable to send OTP. Please try again later.",
      });
    }

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "Profile OTP Error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process request. Please try again.",
    });
  }
};



exports.verifyProfileUpdateOtp = async (req, res) => {
  try {
    const { otp, name, email, phone } = req.body;

    // Validate OTP format
    if (
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit OTP is required",
      });
    }

    const user = await User.findById(
      req.user.id,
    ).select(
      "+profile_update_otp " +
      "+profile_update_otp_expiry " +
      "+profile_update_otp_attempts",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate OTP expiry and attempt limit
    if (
      !user.profile_update_otp ||
      !user.profile_update_otp_expiry ||
      user.profile_update_otp_expiry.getTime() <= Date.now() ||
      (user.profile_update_otp_attempts || 0) >= MAX_OTP_ATTEMPTS
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP. Request a new OTP.",
      });
    }

    const hashedOtp = hashOtp(
      otp,
      user._id,
      "profile_update",
    );

    const otpFilter = {
      _id: user._id,
      email: user.email,

      profile_update_otp: user.profile_update_otp,

      profile_update_otp_expiry: {
        $gt: new Date(),
      },

      profile_update_otp_attempts: {
        $lt: MAX_OTP_ATTEMPTS,
      },
    };

    // Handle incorrect OTP
    if (
      !secureCompare(
        hashedOtp,
        user.profile_update_otp,
      )
    ) {
      const updatedUser = await User.findOneAndUpdate(
        otpFilter,
        {
          $inc: {
            profile_update_otp_attempts: 1,
          },
        },
        {
          returnDocument: "after",
        },
      ).select("+profile_update_otp_attempts");

      if (!updatedUser) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired OTP. Request a new OTP.",
        });
      }

      const remainingAttempts = Math.max(
        0,
        MAX_OTP_ATTEMPTS -
          updatedUser.profile_update_otp_attempts,
      );

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Maximum OTP attempts reached. Request a new OTP.",
      });
    }

    // Validate profile details
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof phone !== "string" ||
      !/^\+?[\d\s()-]{7,20}$/.test(phone.trim()) ||
      phone.replace(/\D/g, "").length < 7 ||
      phone.replace(/\D/g, "").length > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile details",
      });
    }

    // Check whether email is already registered
    const existingUser = await User.findOne({
      email: email.trim(),
      _id: {
        $ne: user._id,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const updateFields = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),

      profile_update_otp: "",
      profile_update_otp_attempts: 0,
    };

    if (req.file) {
      updateFields.profile_image = req.file.filename;
    }

    const unsetFields = {
      profile_update_otp_expiry: "",
    };

    // Invalidate password recovery credentials
    // when the registered email changes
    if (email.trim() !== user.email) {
      updateFields.otp = "";
      updateFields.otp_attempts = 0;
      updateFields.password_reset_token_hash = "";

      unsetFields.otp_expiry = "";
      unsetFields.password_reset_token_expiry = "";
    }

    // Atomically update profile and consume OTP
    const updatedUser = await User.findOneAndUpdate(
      {
        ...otpFilter,

        profile_update_otp_expiry: {
          $gt: new Date(),
        },
      },
      {
        $set: updateFields,
        $unset: unsetFields,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message:
          "OTP is no longer valid. Request a new OTP.",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: getSafeUser(updatedUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    console.error(
      "Profile Verification Error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message:
        "Profile update failed. Please try again.",
    });
  }
};


module.exports = exports;
