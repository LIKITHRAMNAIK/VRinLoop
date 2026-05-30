const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    name: {
      type: String,

      required: true,
    },

    email: {
      type: String,

      required: true,
    },

    subject: {
      type: String,

      required: true,
    },

    type: {
      type: String,

      required: true,
    },

    message: {
      type: String,

      required: true,
    },

    rating: {
      type: Number,

      default: 5,
    },

    image: {
      type: String,

      default: "",
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
