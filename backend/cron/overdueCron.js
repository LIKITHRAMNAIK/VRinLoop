const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  sendOverdueEmail,
} = require("../services/notificationService");

const EmailLog =
  require("../models/EmailLog");

const runOverdueCron = async (testUserId = null) => {
  try {

    console.log(
      "Running Overdue Cron..."
    );

    const filter = {
  "notifications.overdueReminder": true,
};

if (process.env.NODE_ENV === "test") {
  if (!testUserId) {
    throw new Error("Test user ID is required");
  }

  filter._id = testUserId;
}

const users = await User.find(filter);

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    for (const user of users) {

      const transactions =
        await Transaction.find({
          user: user._id,

          due_date: {
            $lt: today,
          },

          status: {
            $ne: "paid",
          },
        });

      console.log(
        `${user.name}: ${transactions.length} overdue`
      );

      const todayKey =
  new Date()
    .toISOString()
    .split("T")[0];

const existingLog =
  await EmailLog.findOne({
    user: user._id,
    type: "overdue",
    date: todayKey,
  });

if (existingLog) {

  console.log(
    `Skipping duplicate Overdue mail for ${user.email}`
  );

} else if (
  transactions.length > 0
) {

    const emailSent = await sendOverdueEmail(
    user,
    transactions
  );

  if (emailSent !== true) {
    console.error(
      `Overdue email failed for ${user.email}`
    );

    continue;
  }

  await EmailLog.create({
    user: user._id,
    type: "overdue",
    date: todayKey,
  });

  console.log(
    `Overdue email accepted by Brevo for ${user.email}`
  );
}
    }

    console.log(
      `Users Found: ${users.length}`
    );

  } catch (error) {

    console.log(
      "Overdue Cron Error:",
      error.message
    );

  }
};

module.exports = {
  runOverdueCron,
};