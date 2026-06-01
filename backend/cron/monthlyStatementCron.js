const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { generateMonthlyStatement } = require("../services/pdfService");
const sendMail = require("../utils/sendMail");

const EmailLog = require("../models/EmailLog");

const runMonthlyStatementCron = async () => {
  try {
    console.log("Running Monthly Statement Cron...");

    const users = await User.find({
      "notifications.monthlyStatement": true,
    });

    for (const user of users) {
      const todayKey = new Date().toISOString().split("T")[0];

      const existingLog = await EmailLog.findOne({
        user: user._id,
        type: "monthly_statement",
        date: todayKey,
      });

      if (existingLog) {
        console.log(`Skipping Monthly Statement for ${user.email}`);

        continue;
      }

      const transactions = await Transaction.find({
        user: user._id,
      });

      console.log(`${user.name}: ${transactions.length} transactions`);

      const pdfPath = await generateMonthlyStatement(user, transactions);

      console.log("PDF Generated:", pdfPath);
      await sendMail(
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
        pdfPath,
      );

      console.log(`Monthly Statement Sent to ${user.email}`);
      await EmailLog.create({
        user: user._id,
        type: "monthly_statement",
        date: todayKey,
      });
    }

    console.log(`Users Found: ${users.length}`);
  } catch (error) {
    console.log("Monthly Statement Cron Error:", error.message);
  }
};

module.exports = {
  runMonthlyStatementCron,
};
