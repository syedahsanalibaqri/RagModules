require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.set('bufferTimeoutMS', 1500);

const app = express();

// Trust proxy for rate limiter behind reverse proxies
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ---------- Mount routes ----------
app.use('/api/auth', require('./modules/authRouter'));
app.use('/api/contact', require('./modules/contact/routes'));

// ---------- Global error handler (catches JSON parse errors etc.) ----------
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error.' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/legal_rag';

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB error:', e.message);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (DB Connection Pending)`));
  });
