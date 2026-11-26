
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    profile_image: {
      type: String,
      default: "",
    },

    // Password Reset OTP
    otp: {
      type: String,
      default: "",
      select: false,
    },

    otp_expiry: {
      type: Date,
      select: false,
    },

    otp_attempts: {
      type: Number,
      default: 0,
      select: false,
    },

    otp_last_sent: {
      type: Date,
      select: false,
    },

    // Secure Password Reset Token
    password_reset_token_hash: {
      type: String,
      default: "",
      select: false,
    },

    password_reset_token_expiry: {
      type: Date,
      select: false,
    },

    // Profile Update OTP
    profile_update_otp: {
      type: String,
      default: "",
      select: false,
    },

    profile_update_otp_expiry: {
      type: Date,
      select: false,
    },

    profile_update_otp_attempts: {
      type: Number,
      default: 0,
      select: false,
    },

    profile_update_otp_last_sent: {
      type: Date,
      select: false,
    },

    // Session Security
    password_changed_at: {
      type: Date,
      select: false,
    },

    // Notification Preferences
    notifications: {
      dueTomorrow: {
        type: Boolean,
        default: true,
      },

      dueToday: {
        type: Boolean,
        default: true,
      },

      weeklyUpcoming: {
        type: Boolean,
        default: true,
      },

      overdueReminder: {
        type: Boolean,
        default: true,
      },

      monthlyStatement: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;

        delete ret.otp;
        delete ret.otp_expiry;
        delete ret.otp_attempts;
        delete ret.otp_last_sent;

        delete ret.password_reset_token_hash;
        delete ret.password_reset_token_expiry;

        delete ret.profile_update_otp;
        delete ret.profile_update_otp_expiry;
        delete ret.profile_update_otp_attempts;
        delete ret.profile_update_otp_last_sent;

        delete ret.password_changed_at;

        return ret;
      },
    },
  },
);

module.exports = mongoose.model("User", userSchema);
