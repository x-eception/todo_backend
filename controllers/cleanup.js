// backend/controllers/cleanup.js
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = async function cleanupOldTasks() {
  const today = new Date();
  const keepKeys = [
    today.toISOString().slice(0,10),
    new Date(today - 86400000).toISOString().slice(0,10),
  ];
  // delete any tasks where dateKey ∉ keepKeys
  const snap = await db.collection('tasks').get();
  const batch = db.batch();
  snap.docs.forEach(doc => {
    const { dateKey } = doc.data();
    if (!keepKeys.includes(dateKey)) {
      batch.delete(doc.ref);
    }
  });
  await batch.commit();
  console.log('Cleanup complete. Kept:', keepKeys);
};
