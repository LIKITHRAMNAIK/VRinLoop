const Feedback = require("../models/Feedback");

const User = require("../models/User");

const sendMail = require("../utils/sendMail");
const fs = require("fs/promises");

// Escape user-provided values before inserting into email HTML
const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
};
// Remove unused uploaded screenshots
const cleanupUploadedFile = async (file) => {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Feedback upload cleanup failed:", error.code);
    }
  }
};
exports.submitFeedback = async (req, res) => {
  let feedbackSaved = false;
let databaseWriteStarted = false;

  try {
    const { subject, type, message, rating } = req.body || {};

const allowedTypes = [
  "Bug Report",
  "Feature Request",
  "UI Improvement",
  "Performance Issue",
  "Other",
];

// Validate subject
if (
  typeof subject !== "string" ||
  !subject.trim() ||
  subject.trim().length > 200
) {
  return res.status(400).json({
    success: false,
    message: "Subject must contain 1 to 200 characters",
  });
}

// Validate feedback category
if (!allowedTypes.includes(type)) {
  return res.status(400).json({
    success: false,
    message: "Invalid feedback type",
  });
}

// Validate message
if (
  typeof message !== "string" ||
  !message.trim() ||
  message.trim().length > 5000
) {
  return res.status(400).json({
    success: false,
    message: "Message must contain 1 to 5000 characters",
  });
}

// Validate rating
const cleanRating = rating === undefined ? 5 : Number(rating);

if (
  (rating !== undefined &&
    typeof rating !== "string" &&
    typeof rating !== "number") ||
  (typeof rating === "string" && !/^[0-5]$/.test(rating)) ||
  !Number.isInteger(cleanRating) ||
  cleanRating < 0 ||
  cleanRating > 5
) {
  return res.status(400).json({
    success: false,
    message: "Rating must be a whole number between 0 and 5",
  });
}

    const user = await User.findById(req.user.id)
  .select("_id name email");

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User account not found. Please log in again.",
  });
}

    databaseWriteStarted = true;

const feedback = await Feedback.create({
  user: user._id,
  name: user.name,
  email: user.email,
  subject: subject.trim(),
  type: type,
  message: message.trim(),
  rating: cleanRating,
  image: req.file ? req.file.filename : "",
});

feedbackSaved = true;

    const html = `
<div
  style="
    font-family: Arial, sans-serif;
    max-width: 700px;
    margin: auto;
    padding: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  "
>

  <h2
    style="
      color:#7c3aed;
      margin-bottom:20px;
    "
  >
    💡 New VRinLoop Feedback
  </h2>

  <table
    style="
      width:100%;
      border-collapse:collapse;
    "
  >

    <tr>
      <td><b>Name</b></td>
      <td>${escapeHtml(user.name)}</td>
    </tr>

    <tr>
      <td><b>Email</b></td>
      <td>${escapeHtml(user.email)}</td>
    </tr>

    <tr>
      <td><b>Subject</b></td>
      <td>${escapeHtml(feedback.subject)}</td>
    </tr>

    <tr>
      <td><b>Type</b></td>
      <td>${escapeHtml(feedback.type)}</td>
    </tr>

    <tr>
      <td><b>Rating</b></td>
      <td>${"⭐".repeat(feedback.rating)}</td>
    </tr>

  </table>

  <br>

  <div
    style="
      background:#f8fafc;
      padding:15px;
      border-radius:10px;
      border-left:4px solid #8b5cf6;
    "
  >

    <b>Message</b>

    <p>
      ${escapeHtml(feedback.message)}
    </p>

  </div>

  <br>

  ${
    req.file
      ? `
        <p style="color:#16a34a;font-weight:bold;">
          📎 Screenshot attached to this email
        </p>
      `
      : ""
  }

  <hr>

  <p
    style="
      color:#64748b;
      font-size:13px;
    "
  >
    Submitted from VRinLoop
  </p>

</div>
`;

        try {
      const emailSent = await sendMail(
        "likithramnaik123@gmail.com",

        `💡 VRinLoop Feedback - ${feedback.type}`,

        html,

        req.file,
      );

      if (emailSent !== true) {
        throw new Error("Feedback email request failed");
      }

      console.log("Feedback email accepted by Brevo");

    } catch (emailError) {
      console.error(
        "Feedback Email Error:",
        emailError.message
      );
    }

    res.status(200).json({
      success: true,

      message: "Feedback submitted successfully",
    });
  } catch (error) {
  console.error("Feedback submission failed:", error.name);

  return res.status(500).json({
    success: false,
    message: "Unable to submit feedback. Please try again later.",
  });
} finally {
  if (!feedbackSaved && !databaseWriteStarted) {
    await cleanupUploadedFile(req.file);
  }
}
};
