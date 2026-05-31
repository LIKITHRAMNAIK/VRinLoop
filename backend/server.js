const express = require('express');
const connectDB = require('./config/db');
const transactionRoutes =
  require('./routes/transactionRoutes');

const authRoutes =
  require('./routes/authRoutes');


const app = express();
const cors = require('cors');
const path = require('path');
const feedbackRoutes =
  require(
    './routes/feedbackRoutes'
  );
const {
  runDueTomorrowCron,
} = require("./cron/dueTomorrowCron");
require('dotenv').config();

const {
  runDueTodayCron,
} = require(
  "./cron/dueTodayCron"
);
const {
  runOverdueCron,
} = require(
  "./cron/overdueCron"
);
const {
  runWeeklyUpcomingCron,
} = require(
  "./cron/weeklyUpcomingCron"
);
app.use(cors());
app.use(express.json());
app.use(
  '/uploads',
  express.static('uploads')
);
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

app.use(
  '/api/feedback',
  feedbackRoutes
);

connectDB();
runDueTomorrowCron();
runDueTodayCron();
runOverdueCron();
runWeeklyUpcomingCron();
// ✅ ONLY THIS ROUTE
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Money Tracker API running');
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
    }
  );

  res.send("Users Updated");
});
app.listen(5000, () => {
  console.log('Server running on port 5000');
});