// backend/controllers/notifications.js
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const { getFirestore } = require('firebase-admin/firestore');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const db = getFirestore();

exports.sendCompletionNotifs = async (req, res) => {
  const { taskId } = req.body;
  const taskSnap = await db.collection('tasks').doc(taskId).get();
  const task = taskSnap.data();
  if (!task.completedAt) {
    return res.status(400).json({ error: 'Not completed yet' });
  }
  const userSnap = await db.collection('users').doc(task.uid).get();
  const user = userSnap.data();

  // Email
  await sgMail.send({
    to: user.email,
    from: process.env.FROM_EMAIL,
    subject: `Task Completed: ${task.title}`,
    text: `You completed "${task.title}" at ${task.completedAt.toDate()}. Good job!`
  });

  // SMS
  if (user.phone) {
    await twClient.messages.create({
      to: user.phone,
      from: process.env.TWILIO_PHONE,
      body: `You completed "${task.title}". Congrats!`
    });
  }

  res.json({ success: true });
};
