const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const sendMail = require("../utils/sendMail");

exports.signup = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profile_image = req.file ? req.file.filename : "";

    const user = await User.create({
      name,

      email,

      phone,

      password: hashedPassword,

      profile_image,
    });

    res.status(201).json({
      success: true,

      message: "Signup successful",

      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    const safeUser = {
      _id: user._id,

      name: user.name,

      email: user.email,

      phone: user.phone,

      profile_image: user.profile_image,
    };

    res.json({
      success: true,

      token,

      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;

    user.otp_expiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendMail(
      email,

      "VRinLoop Password Reset OTP",

      `
        <h2>Your OTP Code</h2>

        <h1>${otp}</h1>

        <p>
          Valid for 10 minutes
        </p>
        `,
    );

    res.json({
      success: true,

      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (user.otp_expiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    res.json({
      success: true,

      message: "OTP verified",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.otp = "";

    await user.save();

    res.json({
      success: true,

      message: "Password updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.sendProfileUpdateOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.profile_update_otp = otp;

    user.profile_update_otp_expiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendMail(
      user.email,

      "VRinLoop Profile Update OTP",

      `

        <div style="font-family:sans-serif">

          <h2>
            Profile Update Verification
          </h2>

          <p>
            Use this OTP to verify
            your profile changes.
          </p>

          <h1>
            ${otp}
          </h1>

          <p>
            Valid for 10 minutes
          </p>

        </div>

        `,
    );

    res.json({
      success: true,

      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.verifyProfileUpdateOtp = async (req, res) => {
  try {
    const { otp, name, email, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.profile_update_otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (user.profile_update_otp_expiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    user.name = name || user.name;

    user.email = email || user.email;

    user.phone = phone || user.phone;

    if (req.file) {
      user.profile_image = req.file.filename;
    }

    user.profile_update_otp = "";

    await user.save();

    const safeUser = {
      _id: user._id,

      name: user.name,

      email: user.email,

      phone: user.phone,

      profile_image: user.profile_image,
    };

    res.json({
      success: true,

      message: "Profile updated successfully",

      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, email, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name || user.name;

    user.email = email || user.email;

    user.phone = phone || user.phone;

    if (req.file) {
      user.profile_image = req.file.filename;
    }

    await user.save();

    res.json({
      success: true,

      message: "Profile updated",

      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

module.exports = exports;
