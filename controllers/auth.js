// backend/controllers/auth.js
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin elsewhere (e.g. in server.js)
const db = getFirestore();

exports.verifyToken = async (req, res, next) => {
  const idToken = req.header('Authorization')?.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    // ensure user doc exists
    const userRef = db.collection('users').doc(decoded.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        email: decoded.email || null,
        phone: decoded.phone_number || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        settings: { theme: 'light', notifications: true },
      });
    }
    next();
  } catch (err) {
    console.error('Auth error', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};
