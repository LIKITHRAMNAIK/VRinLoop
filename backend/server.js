const path = require("path");

const isTestMode = process.env.NODE_ENV === "test";

const envResult = require("dotenv").config({
  path: path.join(__dirname, isTestMode ? ".env.test" : ".env"),
  override: isTestMode,
});

if (isTestMode && envResult.error) {
  console.error("Test environment file could not be loaded.");
  process.exit(1);
}

// Prevent accidental use of production credentials during testing
if (isTestMode) {
  const testEnv = envResult.parsed || {};

  const requiredVariables = [
    "MONGO_URI",
    "JWT_SECRET",
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
  ];

  for (const variable of requiredVariables) {
    if (!testEnv[variable]?.trim()) {
      console.error(`Missing test environment variable: ${variable}`);
      process.exit(1);
    }
  }

  try {
    const testUri = new URL(process.env.MONGO_URI);

    if (
      testUri.protocol !== "mongodb+srv:" ||
      testUri.username !== "vrinloop_test_user" ||
      testUri.pathname !== "/vrinloop_test"
    ) {
      throw new Error("Incorrect test database configuration");
    }
  } catch {
    console.error("Unsafe test database configuration. Startup blocked.");
    process.exit(1);
  }

  console.log("Test environment configuration verified.");
}

const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");

const authRoutes = require("./routes/authRoutes");

const cron = require("node-cron");

const app = express();
const cors = require("cors");
const feedbackRoutes = require("./routes/feedbackRoutes");
const { runDueTomorrowCron } = require("./cron/dueTomorrowCron");

const { runDueTodayCron } = require("./cron/dueTodayCron");
const { runOverdueCron } = require("./cron/overdueCron");
const { runWeeklyUpcomingCron } = require("./cron/weeklyUpcomingCron");
const { runMonthlyStatementCron } = require("./cron/monthlyStatementCron");
// Trust the nearest reverse proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}


// Allowed frontend origins
const allowedOrigins = [
  "https://vr-in-loop.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Secure CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without a browser origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow approved frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Do not grant CORS access to other origins
      return callback(null, false);
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(express.json());

// Serve images from the appropriate upload directory
const uploadDirectory = path.join(
  __dirname,
  isTestMode ? "uploads-test" : "uploads"
);

app.use(
  "/uploads",
  express.static(uploadDirectory, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.use("/api/feedback", feedbackRoutes);


// ✅ ONLY THIS ROUTE
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Money Tracker API running");
});



const PORT = process.env.PORT || 5000;

// Start server only after database connection
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await connectDB();

// Verify actual database connection in test mode
if (isTestMode) {
  if (mongoose.connection.name !== "vrinloop_test") {
    await mongoose.disconnect();
    throw new Error("Unsafe database connection. Startup blocked.");
  }

  console.log("Connected to isolated database: vrinloop_test");
}

    // Schedule notification cron jobs outside test mode
if (!isTestMode && process.env.ENABLE_CRON !== "false") {
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
} else {
  console.log("Scheduled notification cron jobs disabled.");
}

    // Start accepting API requests
if (isTestMode) {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Test server running at http://127.0.0.1:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
  } catch (error) {
    console.error("Server Startup Error:", error.message);
    process.exit(1);
  }
};

startServer();
