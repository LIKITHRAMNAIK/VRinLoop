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

require('dotenv').config();

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

// ✅ ONLY THIS ROUTE
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Money Tracker API running');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});