const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "sent",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "EmailLog",
  emailLogSchema,
);