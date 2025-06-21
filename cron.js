// backend/cron.js
const cron = require('node-cron');
const cleanup = require('./controllers/cleanup');

// run at midnight server time every day
cron.schedule('0 0 * * *', () => {
  console.log('Running daily cleanup...');
  cleanup();
});
