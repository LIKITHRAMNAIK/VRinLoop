
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    // Validate Authorization header
    if (
      typeof authorization !== "string" ||
      !/^Bearer\s+\S+$/i.test(authorization)
    ) {
      return res.status(401).json({
        message: "No valid token provided",
      });
    }

    const token = authorization.split(/\s+/)[1];

    // Verify JWT signature and expiration
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      },
    );

    // Validate token payload
    if (
      !decoded ||
      typeof decoded.id !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(decoded.id) ||
      typeof decoded.exp !== "number"
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Verify that the user still exists
    const user = await User.findById(decoded.id)
      .select("_id +password_changed_at");

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists",
      });
    }

    // Current password change timestamp
    const currentPasswordChangedAt =
      user.password_changed_at
        ? user.password_changed_at.getTime()
        : 0;

    // Support existing tokens issued before this update
    const tokenPasswordChangedAt =
      decoded.pwdChangedAt === undefined
        ? 0
        : decoded.pwdChangedAt;

    // Reject sessions created before a password reset
    if (
      tokenPasswordChangedAt !== currentPasswordChangedAt
    ) {
      return res.status(401).json({
        message:
          "Session expired. Please log in again.",
      });
    }

    // Preserve existing controller compatibility
    req.user = decoded;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error(
      "Authentication Error:",
      error.message,
    );

    return res.status(500).json({
      message: "Authentication failed. Please try again.",
    });
  }
};
