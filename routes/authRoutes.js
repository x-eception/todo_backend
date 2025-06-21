// backend/routes/authRoutes.js
const express = require('express');
const { verifyToken } = require('../controllers/auth');
const router = express.Router();

// Protected health-check
router.get('/verify', verifyToken, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email });
});

module.exports = router;
