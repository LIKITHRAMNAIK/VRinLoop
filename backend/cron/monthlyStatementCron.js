const fs = require("fs/promises");

const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { generateMonthlyStatement } = require("../services/pdfService");
const sendMail = require("../utils/sendMail");

const EmailLog = require("../models/EmailLog");

const runMonthlyStatementCron = async (testUserId = null) => {
  try {
    console.log("Running Monthly Statement Cron...");

    const filter = {
      "notifications.monthlyStatement": true,
    };

    if (process.env.NODE_ENV === "test") {
      if (!testUserId) {
        throw new Error("Test user ID is required");
      }

      filter._id = testUserId;
    }

    const users = await User.find(filter);

    for (const user of users) {
      let pdfPath = null;

      try {
        const todayKey = new Date()
          .toISOString()
          .split("T")[0];

        const existingLog = await EmailLog.findOne({
          user: user._id,
          type: "monthly_statement",
          date: todayKey,
        });

        if (existingLog) {
          console.log(
            `Skipping Monthly Statement for ${user.email}`
          );

          continue;
        }

        const transactions = await Transaction.find({
          user: user._id,
        });

        console.log(
          `${user.name}: ${transactions.length} transactions`
        );

        pdfPath = await generateMonthlyStatement(
          user,
          transactions
        );

        console.log("PDF Generated:", pdfPath);

        const emailSent = await sendMail(
          user.email,
          "📄 Monthly Financial Statement",
          `
          <p>Hello ${user.name},</p>

          <p>
            Your monthly VRinLoop
            financial statement
            is attached.
          </p>

          <p>
            Please find the PDF
            report attached for
            your records.
          </p>

          <br/>

          <p>
            Regards,<br/>
            VRinLoop Team
          </p>
          `,
          pdfPath
        );

        if (emailSent !== true) {
          throw new Error(
            "Monthly Statement email request failed"
          );
        }

        await EmailLog.create({
          user: user._id,
          type: "monthly_statement",
          date: todayKey,
        });

        console.log(
          `Monthly Statement accepted by Brevo for ${user.email}`
        );

      } catch (error) {
        console.error(
          `Monthly Statement failed for ${user.email}:`,
          error.message
        );

      } finally {
        if (pdfPath) {
          try {
            await fs.unlink(pdfPath);

            console.log("Temporary PDF deleted");
          } catch (error) {
            if (error.code !== "ENOENT") {
              console.error(
                "PDF Cleanup Error:",
                error.message
              );
            }
          }
        }
      }
    }

    console.log(`Users Found: ${users.length}`);

  } catch (error) {
    console.error(
      "Monthly Statement Cron Error:",
      error.message
    );
  }
};

module.exports = {
  runMonthlyStatementCron,
};
