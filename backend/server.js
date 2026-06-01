const express = require("express");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");

const authRoutes = require("./routes/authRoutes");

const cron = require("node-cron");

const app = express();
const cors = require("cors");
const path = require("path");
const feedbackRoutes = require("./routes/feedbackRoutes");
const { runDueTomorrowCron } = require("./cron/dueTomorrowCron");
require("dotenv").config();

const { runDueTodayCron } = require("./cron/dueTodayCron");
const { runOverdueCron } = require("./cron/overdueCron");
const { runWeeklyUpcomingCron } = require("./cron/weeklyUpcomingCron");
const { runMonthlyStatementCron } = require("./cron/monthlyStatementCron");
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/feedback", feedbackRoutes);

connectDB();
cron.schedule("0 8 * * *", runDueTodayCron);

cron.schedule("5 8 * * *", runDueTomorrowCron);

cron.schedule("0 9 * * *", runOverdueCron);

cron.schedule("0 8 * * 1", runWeeklyUpcomingCron);

cron.schedule("0 9 3 * *", runMonthlyStatementCron);

console.log("Due Today Cron Scheduled");

console.log("Due Tomorrow Cron Scheduled");

console.log("Overdue Cron Scheduled");

console.log("Weekly Upcoming Cron Scheduled");

console.log("Monthly Statement Cron Scheduled");
// ✅ ONLY THIS ROUTE
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Money Tracker API running");
});

const User = require("./models/User");

app.get("/fix-users", async (req, res) => {
  await User.updateMany(
    {},
    {
      $set: {
        notifications: {
          dueTomorrow: true,
          dueToday: true,
          weeklyUpcoming: true,
          overdueReminder: true,
          monthlyStatement: true,
        },
      },
    },
  );

  res.send("Users Updated");
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
