const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);

  if (!match) {
    return res.status(401).json({ message: 'No valid Bearer token provided' });
  }

  const token = match[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next(); // ✅ Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized - Invalid token',
      error: error.message
    });
  }
};
