require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

// 🔐 Firebase Admin SDK Init
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();
const app = express();

// ✅ Parse incoming JSON
app.use(express.json());

// 🌐 CORS Config
const allowedOrigins = [
  'http://localhost:3000',
  'https://todo-frontend-nu-weld.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`❌ CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
}));

// 🔒 Token Verification Middleware
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

// 🔁 Routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notifController = require('./controllers/notifications');
const cleanup = require('./controllers/cleanup');

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.post('/notify/completion', notifController.sendCompletionNotifs);

// 🕒 Daily Task Cleanup Cron Job
cron.schedule('0 0 * * *', () => {
  console.log('🧹 Running daily cleanup...');
  cleanup()
    .then(() => console.log('✅ Cleanup completed'))
    .catch(err => console.error('❌ Cleanup failed:', err));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
