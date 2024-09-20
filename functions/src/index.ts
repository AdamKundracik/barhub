import { CallableContext } from 'firebase-functions/lib/common/providers/https';
import { InfinityScrollPost, Post, User } from '../../shared';

const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const functions = require('firebase-functions');
const bucket = admin.storage().bucket();

// TODO: FINISH FUNCTION
export const createUser = functions.auth.user().onCreate(user => {
  return admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)), { merge: true });
});

export const deleteUser = functions.auth.user().onDelete(user => {
  return admin.firestore().collection('users').doc(user.uid).delete();
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
  async (
    post: {
      creationTime: Date;
      fileId: string;
      folderId: string;
      name: string;
      uid: string;
    },
    context: CallableContext
  ) => {
    await db
      .collection('posts')
      .doc(context.auth.uid)
      .set(post, { merge: true });
  }
);

exports.getAllExistingUsers = functions.https.onCall(
  async (data: any, context: CallableContext) => {
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

exports.toggleLike = functions.https.onCall(
  async (data, context: CallableContext) => {
    const { postId, userId } = data;

    if (!postId || !userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing postId or userId'
      );
    }

    try {
      const likeDocRef = db
        .collection('posts')
        .doc(postId)
        .collection('likes')
        .doc(userId);
      const likeDoc = await likeDocRef.get();

      if (likeDoc.exists) {
        await likeDocRef.delete();
      } else {
        await likeDocRef.set({});
      }
    } catch (error) {
      console.error('Error toggling like: ', error);
    }
  }
);

exports.getLikeStatus = functions.https.onCall(
  async (data, context: CallableContext) => {
    const { postId, userId } = data;

    if (!postId || !userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing postId or userId'
      );
    }

    try {
      const likeDocRef = db
        .collection('posts')
        .doc(postId)
        .collection('likes')
        .doc(userId);
      const likeDoc = await likeDocRef.get();

      return await likeDoc.exists;
    } catch (error) {
      console.error('Error getting like status: ', error);
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
    }
  }
);

exports.getFreshContent = functions.https.onCall(
  async (
    data,
    context: CallableContext
  ): Promise<InfinityScrollPost | null> => {
    try {
      // Ensure that the request is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to fetch posts.'
        );
      }

      // Get the user's uid
      const uid = context.auth.uid;

      // Retrieve pagination parameters from the input data
      const { pageSize = 3, lastVisible = null } = data;

      // Reference to the 'posts' collection with timestamp ordering
      let query = db
        .collection('posts')
        .orderBy('timestamp', 'desc') // Order by the most recent posts first
        .limit(pageSize);

      // Validate the `lastVisible` parameter
      if (lastVisible) {
        // Fetch the document that corresponds to `lastVisible`
        const lastVisibleDoc = await db
          .collection('posts')
          .doc(lastVisible)
          .get();

        // If the document exists, use it as the starting point for the next query
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          console.error('Invalid lastVisible document.');
          return { lastVisible: '', posts: [] } as InfinityScrollPost;
        }
      }

      // Execute the query
      const querySnapshot = await query.get();

      // Check if the result is empty
      if (querySnapshot.empty) {
        return { lastVisible: '', posts: [] } as InfinityScrollPost;
      }

      // Process each post and check if the user liked the post and count likes and comments
      const items: Post[] = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const postData = doc.data();

          // Count the number of likes in the 'likes' subcollection
          const likesSnapshot = await db
            .collection('posts')
            .doc(doc.id)
            .collection('likes')
            .get();
          const likesCount = likesSnapshot.size;

          // Count the number of comments in the 'comments' subcollection
          const commentsSnapshot = await db
            .collection('posts')
            .doc(doc.id)
            .collection('comments')
            .get();
          const commentsCount = commentsSnapshot.size;

          // Check if the 'likes' subcollection contains the user's uid
          const likeSnapshot = await db
            .collection('posts')
            .doc(doc.id)
            .collection('likes')
            .doc(uid)
            .get();

          // Add the `isLiked`, `likesCount`, and `commentsCount` fields
          return {
            ...postData,
            id: doc.id,
            isLiked: likeSnapshot.exists, // true if the user liked the post, otherwise false
            likesCount,
            commentsCount,
          };
        })
      );

      // Get the last document to be used for the next page
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      // Return the fetched posts and the last visible document's ID
      return {
        posts: items,
        lastVisible: lastDoc.id, // Use the ID of the last document for pagination
      } as InfinityScrollPost;
    } catch (error) {
      console.error('Error fetching fresh content:', error);
      return null;
    }
  }
);

exports.getPostsByPlaceId = functions.https.onCall(
  async (
    data,
    context: CallableContext
  ): Promise<InfinityScrollPost | null> => {
    try {
      const { pageSize = 1, lastVisible = null, placeId = null } = data;

      // Reference to the 'posts' collection with timestamp ordering
      let query = db
        .collection('posts')
        .where('folderId', '==', placeId)
        .orderBy('timestamp', 'desc')
        .limit(pageSize);

      // Validate the `lastVisible` parameter
      if (lastVisible) {
        // Fetch the document that corresponds to `lastVisible`
        const lastVisibleDoc = await db
          .collection('posts')
          .doc(lastVisible)
          .get();

        // If the document exists, use it as the starting point for the next query
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          console.error('Invalid lastVisible document.');
          return { lastVisible: '', posts: [] } as InfinityScrollPost;
        }
      }

      // Execute the query
      const querySnapshot = await query.get();

      // Check if the result is empty
      if (querySnapshot.empty) {
        return { lastVisible: '', posts: [] } as InfinityScrollPost;
      }

      // Map the fetched documents to Post objects
      const items: Post[] = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Get the last document to be used for the next page
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      // Return the fetched posts and the last visible document's ID
      return {
        posts: items,
        lastVisible: lastDoc.id, // Use the ID of the last document for pagination
      } as InfinityScrollPost;
    } catch (error) {
      console.error('Error fetching fresh content:', error);
      return null;
    }
  }
);

// SCHEDULE FUNCTIONS

exports.deleteOldPostsAndImages = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async context => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
      // Query for posts older than 3 days
      const postsSnapshot = await db
        .collection('posts')
        .where('timestamp', '<', threeDaysAgo.getTime())
        .get();

      const deletePromises: Promise<any>[] = [];

      postsSnapshot.forEach(doc => {
        const postData: Post = doc.data();
        const fileId = postData.folderId + '/' + postData.fileId;

        // Delete the image from Firebase Storage
        const file = bucket.file(fileId);
        deletePromises.push(file.delete());

        deletePromises.push(deleteSubcollection(doc.ref, 'likes'));
        deletePromises.push(deleteSubcollection(doc.ref, 'comments'));

        // Delete the post document from Firestore
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);
      console.info('Successfully deleted old posts and images');
    } catch (error) {
      console.error('Error deleting old posts and images:', error);
    }
  });

exports.addComment = functions.https.onCall(async (data, context) => {
  const { postId, userId, userName, userPhotoUrl, commentText } = data;

  if (!postId || !userId || !userName || !userPhotoUrl || !commentText) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing postId, userId, userName, userPhotoUrl, or commentText'
    );
  }

  try {
    const comment = {
      userId,
      userName,
      userPhotoUrl,
      commentText,
      creationTime: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .add(comment);
  } catch (error) {
    console.error('Error adding comment: ', error);
  }
});

exports.getComments = functions.https.onCall(async (data, context) => {
  const { postId } = data;

  if (!postId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing postId');
  }

  try {
    const commentsSnapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('creationTime', 'asc')
      .get();

    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { comments };
  } catch (error) {
    console.error('Error fetching comments: ', error);
  }
});

async function deleteSubcollection(postRef, subcollectionName) {
  const subcollectionSnapshot = await postRef
    .collection(subcollectionName)
    .get();
  const deletePromises = subcollectionSnapshot.docs.map(doc =>
    doc.ref.delete()
  );
  await Promise.all(deletePromises);
}
