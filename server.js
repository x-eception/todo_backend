// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

// 1) Load Firebase Admin SDK with your service account
const serviceAccount = require('./todo-list13-firebase-adminsdk-fbsvc-40e6ec3487.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 2) Express app setup
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 3) Add user authentication middleware for protected routes
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

// 4) Import and mount routes
const authRoutes      = require('./routes/authRoutes');
const taskRoutes      = require('./routes/taskRoutes');
const notifController = require('./controllers/notifications');
const cleanup         = require('./controllers/cleanup');

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.post('/notify/completion', notifController.sendCompletionNotifs);

// 5) Schedule task cleanup (runs every day at midnight)
cron.schedule('0 0 * * *', () => {
  console.log('🔄 Running daily cleanup of old tasks…');
  cleanup()
    .then(() => console.log('✔️ Cleanup complete'))
    .catch(err => console.error('❌ Cleanup error:', err));
});

// 6) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
