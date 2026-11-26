
const fs = require("fs/promises");
const path = require("path");

const sendMail = async (to, subject, html, file = null) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName =
      process.env.BREVO_SENDER_NAME || "VRinLoop";

    if (!apiKey || !senderEmail) {
      throw new Error("Brevo environment variables are missing");
    }

    if (!to) {
      throw new Error("Recipient email is missing");
    }

    const emailData = {
      sender: {
        name: senderName,
        email: senderEmail,
      },

      to: [
        {
          email: to,
        },
      ],

      subject: subject,

      htmlContent: html,
    };

    // Support PDF statements and feedback attachments
    if (file) {
      const filePath =
        typeof file === "string" ? file : file.path;

      if (!filePath) {
        throw new Error("Attachment file path is missing");
      }

      const fileName =
        file.originalname ||
        file.filename ||
        path.basename(filePath);

      const fileContent = await fs.readFile(filePath);

      emailData.attachment = [
        {
          name: fileName,
          content: fileContent.toString("base64"),
        },
      ];
    }

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },

        body: JSON.stringify(emailData),

        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Brevo API ${response.status}: ${
          result.message || "Email request failed"
        }`
      );
    }

    console.log(
      "Email accepted by Brevo:",
      result.messageId
    );

    return true;
  } catch (error) {
    console.error("Mail Error:", error.message);

    throw error;
  }
};

module.exports = sendMail;
