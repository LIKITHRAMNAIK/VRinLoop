const cron = require("node-cron");

const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  sendDueTomorrowEmail,
} = require("../services/notificationService");

const EmailLog =
  require("../models/EmailLog");

const runDueTomorrowCron = async () => {
  try {
    console.log(
      "Running Due Tomorrow Cron..."
    );

    const users =
      await User.find({
        "notifications.dueTomorrow":
          true,
      });

    for (const user of users) {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd =
    new Date(tomorrow);

  tomorrowEnd.setHours(
    23,
    59,
    59,
    999
  );

  const transactions =
    await Transaction.find({
      user: user._id,

      due_date: {
        $gte: tomorrow,
        $lte: tomorrowEnd,
      },

      status: {
        $ne: "paid",
      },
    });

  console.log(
    `${user.name}: ${transactions.length} due tomorrow`
  );
  const todayKey =
  new Date()
    .toISOString()
    .split("T")[0];

const existingLog =
  await EmailLog.findOne({
    user: user._id,
    type: "due_tomorrow",
    date: todayKey,
  });

if (existingLog) {

  console.log(
    `Skipping duplicate Due Tomorrow mail for ${user.email}`
  );

} else if (
  transactions.length > 0
) {

  await sendDueTomorrowEmail(
    user,
    transactions
  );

  await EmailLog.create({
    user: user._id,
    type: "due_tomorrow",
    date: todayKey,
  });

  console.log(
    `Email sent to ${user.email}`
  );
}
  transactions.forEach((tx) => {
  console.log({
    person: tx.person_name,
    type: tx.transaction_type,
    principal: tx.principal_amount,
    interest: tx.base_interest,
    emi: tx.emi_amount,
    due: tx.due_date,
  });
});
}
    console.log(
      `Users Found: ${users.length}`
    );
  } catch (error) {
    console.log(
      "Due Tomorrow Cron Error:",
      error.message
    );
  }
};

module.exports = {
  runDueTomorrowCron,
};