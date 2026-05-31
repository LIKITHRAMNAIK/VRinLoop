const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  sendWeeklyUpcomingEmail,
} = require("../services/notificationService");

const EmailLog =
  require("../models/EmailLog");

const runWeeklyUpcomingCron =
  async () => {
    try {

      console.log(
        "Running Weekly Upcoming Cron..."
      );

      const users =
        await User.find({
          "notifications.weeklyUpcoming":
            true,
        });

      for (const user of users) {

        const startDate =
          new Date();

        startDate.setHours(
          0,
          0,
          0,
          0
        );

        const endDate =
          new Date(startDate);

        endDate.setDate(
          endDate.getDate() + 7
        );

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        const transactions =
          await Transaction.find({
            user: user._id,

            due_date: {
              $gte: startDate,
              $lte: endDate,
            },

            status: {
              $ne: "paid",
            },
          });

        console.log(
          `${user.name}: ${transactions.length} upcoming this week`
        );

        const todayKey =
  new Date()
    .toISOString()
    .split("T")[0];

const existingLog =
  await EmailLog.findOne({
    user: user._id,
    type: "weekly_upcoming",
    date: todayKey,
  });

if (existingLog) {

  console.log(
    `Skipping duplicate Weekly mail for ${user.email}`
  );

} else if (
  transactions.length > 0
) {

  await sendWeeklyUpcomingEmail(
    user,
    transactions
  );

  await EmailLog.create({
    user: user._id,
    type: "weekly_upcoming",
    date: todayKey,
  });

  console.log(
    `Weekly email sent to ${user.email}`
  );
}
      }

      console.log(
        `Users Found: ${users.length}`
      );

    } catch (error) {

      console.log(
        "Weekly Cron Error:",
        error.message
      );

    }
  };

module.exports = {
  runWeeklyUpcomingCron,
};