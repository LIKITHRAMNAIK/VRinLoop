const cron = require("node-cron");

const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  sendDueTodayEmail,
} = require("../services/notificationService");

const EmailLog =
  require("../models/EmailLog");

const runDueTodayCron = async (testUserId = null) => {
  try {

    console.log(
      "Running Due Today Cron..."
    );

    const filter = {
  "notifications.dueToday": true,
};

if (process.env.NODE_ENV === "test") {
  if (!testUserId) {
    throw new Error("Test user ID is required");
  }

  filter._id = testUserId;
}

const users = await User.find(filter);

    for (const user of users) {

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const todayEnd =
        new Date(today);

      todayEnd.setHours(
        23,
        59,
        59,
        999
      );

      const transactions =
        await Transaction.find({
          user: user._id,

          due_date: {
            $gte: today,
            $lte: todayEnd,
          },

          status: {
            $ne: "paid",
          },
        });

      console.log(
        `${user.name}: ${transactions.length} due today`
      );

      const todayKey =
  new Date()
    .toISOString()
    .split("T")[0];

const existingLog =
  await EmailLog.findOne({
    user: user._id,
    type: "due_today",
    date: todayKey,
  });

if (existingLog) {

  console.log(
    `Skipping duplicate Due Today mail for ${user.email}`
  );

} else if (
  transactions.length > 0
) {

    const emailSent = await sendDueTodayEmail(
    user,
    transactions
  );

  if (emailSent !== true) {
    console.error(
      `Due Today email failed for ${user.email}`
    );

    continue;
  }

  await EmailLog.create({
    user: user._id,
    type: "due_today",
    date: todayKey,
  });

  console.log(
    `Due Today email accepted by Brevo for ${user.email}`
  );
}
    }

    console.log(
      `Users Found: ${users.length}`
    );

  } catch (error) {

    console.log(
      "Due Today Cron Error:",
      error.message
    );

  }
};

module.exports = {
  runDueTodayCron,
};