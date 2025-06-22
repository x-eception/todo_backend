require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

// 🔐 Firebase credentials via env
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://todo-frontend-nu-weld.vercel.app',
  credentials: true
}));
app.use(express.json());

// 🔒 Auth middleware
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

// ✅ Routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notifController = require('./controllers/notifications');
const cleanup = require('./controllers/cleanup');

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.post('/notify/completion', notifController.sendCompletionNotifs);

// 🕒 Daily cleanup
cron.schedule('0 0 * * *', () => {
  console.log('🔄 Running daily cleanup...');
  cleanup()
    .then(() => console.log('✔️ Cleanup complete'))
    .catch(err => console.error('❌ Cleanup error:', err));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
