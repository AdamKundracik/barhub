import { CallableContext } from 'firebase-functions/lib/common/providers/https';
import { Post, User } from '../../shared';

const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const functions = require('firebase-functions');

//TODO: FINISH FUNCTION
export const createUser = functions.auth.user().onCreate(user => {
  return admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)));
});

export const setUser = functions.https.onCall(
  async (user: User, context: CallableContext) => {
    await db
      .collection('users')
      .doc(context.auth.uid)
      .set(user, { merge: true });
  }
);

export const savePost = functions.https.onCall(
  async (post: Post, context: CallableContext) => {
    await db.collection('posts').doc(post.fileId).set(post);
  }
);

export const getAllUsers = functions.https.onCall(
  async (data: any, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const usersCollection = db.collection('users');

    try {
      const snapshot = await usersCollection.get();
      const users: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { users };
    } catch (error) {
      console.error('Error getting users collection: ', error);
      throw new functions.https.HttpsError(
        'internal',
        'Unable to retrieve users'
      );
    }
  }
);

export const getCurrentUser = functions.https.onCall(
  async (data, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const uid = context.auth.uid;

    try {
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return console.error('USER NOT FOUND');
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user data: ', error);
    }
  }
);

export const testLog = functions.https.onCall(
  async (data, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const usersCollection = db.collection('users');

    try {
      const snapshot = await usersCollection
        .where('uid', '!=', context.auth.uid)
        .get();
      const users: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { users };
    } catch (error) {
      console.error('Error getting users collection: ', error);
      throw new functions.https.HttpsError(
        'internal',
        'Unable to retrieve users'
      );
    }
  }
);

exports.getFreshContent = functions.https.onCall(
  async (data, context: CallableContext): Promise<Post[]> => {
    function calculateFreshnessScore(postTimestamp: number, now: number) {
      const timeDifference = now - postTimestamp; // Time difference in milliseconds
      const timeDifferenceInHours = timeDifference / (60 * 60 * 1000); // Convert to hours

      // Example time decay function: exponential decay
      const freshnessScore = Math.exp(-timeDifferenceInHours);

      return freshnessScore;
    }

    try {
      const now = admin.firestore.Timestamp.now();
      const threeDaysAgo = new Date(
        now.toDate().getTime() - 3 * 24 * 60 * 60 * 1000
      );
      const threeDayssAgoTimestamp = threeDaysAgo.getTime();

      const query = await db
        .collection('posts')
        .where('timestamp', '>=', threeDayssAgoTimestamp)
        .limit(10);

      const querySnapshot = await query.get();

      if (querySnapshot.empty) {
        console.error('snapshot is empty');
        return null;
      }

      const items: Post[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return items;
    } catch (error) {
      console.error('Error fetching fresh content:', error);
      return null;
    }
  }
);

exports.getPostsByPlaceId = functions.https.onCall(
  async (data, context: CallableContext): Promise<Post[]> => {
    try {
      const now = admin.firestore.Timestamp.now();
      const threeDaysAgo = new Date(
        now.toDate().getTime() - 3 * 24 * 60 * 60 * 1000
      );
      const threeDaysAgoTimestamp = threeDaysAgo.getTime();

      if (!data.placeId) {
        throw new Error('Missing placeId');
      }

      const query = await db
        .collection('posts')
        .where('folderId', '==', data?.placeId)
        .where('timestamp', '>=', threeDaysAgoTimestamp);

      const querySnapshot = await query.get();

      if (querySnapshot.empty) {
        console.error('snapshot is empty');
        return null;
      }

      const items: Post[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return items;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return null;
    }
  }
);
