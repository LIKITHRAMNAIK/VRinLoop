const Feedback = require("../models/Feedback");

const User = require("../models/User");

const sendMail = require("../utils/sendMail");

exports.submitFeedback = async (req, res) => {
  try {
    if (!req.body.subject || !req.body.type || !req.body.message) {
      return res.status(400).json({
        success: false,

        message: "Please fill all required fields",
      });
    }

    const user = await User.findById(req.user.id);

    const feedback = await Feedback.create({
      user: user._id,

      name: user.name,

      email: user.email,

      subject: req.body.subject,

      type: req.body.type,

      message: req.body.message,

      rating: req.body.rating,

      image: req.file ? req.file.filename : "",
    });

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
      <td>${user.name}</td>
    </tr>

    <tr>
      <td><b>Email</b></td>
      <td>${user.email}</td>
    </tr>

    <tr>
      <td><b>Subject</b></td>
      <td>${req.body.subject}</td>
    </tr>

    <tr>
      <td><b>Type</b></td>
      <td>${req.body.type}</td>
    </tr>

    <tr>
      <td><b>Rating</b></td>
      <td>${"⭐".repeat(Number(req.body.rating || 0))}</td>
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
      ${req.body.message}
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

    console.log("Uploaded File:", req.file);

    await sendMail(
      "likithramnaik123@gmail.com",

      `💡 VRinLoop Feedback - ${req.body.type}`,

      html,

      req.file,
    );

    res.status(200).json({
      success: true,

      message: "Feedback submitted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
