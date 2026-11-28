const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  immutable: true,
  index: true,
},

    name: {
  type: String,
  required: true,
  trim: true,
  maxlength: 100,
},

    email: {
  type: String,
  required: true,
  trim: true,
  maxlength: 254,
  match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
},

    subject: {
  type: String,
  required: true,
  trim: true,
  maxlength: 200,
},

    type: {
  type: String,
  required: true,
  enum: [
    "Bug Report",
    "Feature Request",
    "UI Improvement",
    "Performance Issue",
    "Other",
  ],
},

    message: {
  type: String,
  required: true,
  trim: true,
  maxlength: 5000,
},

    rating: {
  type: Number,
  default: 5,
  min: 0,
  max: 5,
  validate: {
    validator: Number.isInteger,
    message: "Rating must be a whole number between 0 and 5",
  },
},

    image: {
  type: String,
  default: "",
  maxlength: 255,
  validate: {
    validator: function (value) {
      return (
        value === "" ||
        /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(value)
      );
    },
    message: "Invalid image filename",
  },
},
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
