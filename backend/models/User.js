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
    },

    profile_image: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      default: "",
    },

    otp_expiry: {
      type: Date,
    },

    profile_update_otp: {
      type: String,
      default: "",
    },

    profile_update_otp_expiry: {
  type: Date,
},

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
  },
);

module.exports = mongoose.model("User", userSchema);
