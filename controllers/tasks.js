// backend/controllers/tasks.js
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

exports.getTasks = async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  const tasksRef = db.collection('tasks')
    .where('uid', '==', req.user.uid)
    .where('dateKey', '==', date)
    .orderBy('createdAt', 'asc');
  const snap = await tasksRef.get();
  const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(tasks);
};

exports.addTasks = async (req, res) => {
  const { titles } = req.body; // array of strings
  if (!Array.isArray(titles) || !titles.length) {
    return res.status(400).json({ error: 'titles[] required' });
  }
  const dateKey = new Date().toISOString().slice(0,10);
  const batch = db.batch();
  const results = [];

  for (let title of titles) {
    const q = await db.collection('tasks')
      .where('uid','==',req.user.uid)
      .where('dateKey','==',dateKey)
      .where('title','==',title)
      .get();
    if (!q.empty) {
      results.push({ title, success: false, error: 'Duplicate' });
      continue;
    }
    const ref = db.collection('tasks').doc();
    batch.set(ref, {
      uid: req.user.uid,
      title,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
      dateKey
    });
    results.push({ title, success: true, id: ref.id });
  }

  await batch.commit();
  res.json(results);
};

exports.completeTask = async (req, res) => {
  const { id } = req.params;
  const taskRef = db.collection('tasks').doc(id);
  await taskRef.update({ completedAt: FieldValue.serverTimestamp() });
  const updated = (await taskRef.get()).data();
  res.json({ success: true, task: { id, ...updated } });
};
