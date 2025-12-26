const admin = require('firebase-admin');
const serviceAccount = require('./functions/cherrytree-cofounder-agreement-firebase-adminsdk-w3p16-dade73f3d1.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function deleteAllAuthUsers() {
  const listUsersResult = await auth.listUsers();
  for (const user of listUsersResult.users) {
    await auth.deleteUser(user.uid);
    console.log(`Deleted auth user: ${user.email || user.uid}`);
  }
}

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${snapshot.size} docs from ${collectionName}`);
}

async function cleanup() {
  console.log('Starting cleanup...');

  await deleteAllAuthUsers();
  console.log('✅ All Firebase Auth users deleted');

  await deleteCollection('users');
  await deleteCollection('projects');
  await deleteCollection('proWaitlist');
  console.log('✅ All Firestore collections deleted');

  console.log('✅ Cleanup complete! Start fresh.');
  process.exit(0);
}

cleanup().catch(console.error);
