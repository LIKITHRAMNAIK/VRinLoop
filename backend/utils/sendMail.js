const nodemailer = require("nodemailer");

const sendMail = async (to, subject, html, file = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to,

      subject,

      html,

      attachments: file
        ? [
            {
              filename: file.originalname || file.filename,
              path: file.path || file,
            },
          ]
        : [],
    });

    console.log("Email Sent Successfully");
  } catch (error) {
    console.log("Mail Error:", error.message);
  }
};

module.exports = sendMail;
