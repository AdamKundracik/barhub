import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

interface PushTokenData {
  userId: string;
  token: string;
}

const MIN_UPLOAD_INTERVAL = 5 * 60 * 1000; // 5 minút v ms

export class UserService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Add a push token for a user
   * Ensures the token is only added once (no duplicates)
   */
  async addPushToken({ userId, token }: PushTokenData) {
    if (!userId || !token) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required field: userId or token'
      );
    }

    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        pushToken: admin.firestore.FieldValue.arrayUnion(token),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error adding push token:', error);
      throw new HttpsError(
        'internal',
        `Failed to add push token: ${error.message}`
      );
    }
  }

  /**
   * Remove a push token for a user
   * Only removes the specified token, keeps other tokens intact
   */
  async removePushToken({ userId, token }: PushTokenData) {
    if (!userId || !token) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required field: userId or token'
      );
    }

    try {
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      // Get existing tokens and ensure it's an array
      const existingTokens = userDoc.data()?.pushToken;
      const tokens: string[] = Array.isArray(existingTokens)
        ? existingTokens
        : existingTokens
          ? [existingTokens]
          : [];

      // Filter out the token you want to remove
      const updatedTokens = tokens.filter(t => t !== token);

      // Update Firestore with the new array
      await userRef.update({ pushToken: updatedTokens });

      return { success: true };
    } catch (error: any) {
      console.error('Error removing push token:', error);
      throw new HttpsError(
        'internal',
        `Failed to remove push token: ${error.message}`
      );
    }
  }

  /**
   * Fetch all push tokens for a user
   */
  async getPushTokens(userId: string): Promise<string[]> {
    if (!userId) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required field: userId'
      );
    }

    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const data = userDoc.data();
      if (!data) return [];

      const tokens = data.pushToken;
      if (!tokens) return [];

      return Array.isArray(tokens) ? tokens : [tokens];
    } catch (error: any) {
      console.error('Error fetching push tokens:', error);
      throw new HttpsError(
        'internal',
        `Failed to fetch push tokens: ${error.message}`
      );
    }
  }

  /**
   * Check if user can upload a new photo based on lastUploadedPost
   */
  async canUploadPhoto(userId: string) {
    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    const userDoc = await this.db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const lastUploaded: admin.firestore.Timestamp | undefined =
      userDoc.data()?.lastUploadedPost;

    if (!lastUploaded) {
      // User never uploaded → can upload
      return { canUpload: true };
    }

    const now = Date.now();
    const lastUploadTime = lastUploaded.toMillis();
    const diff = now - lastUploadTime;

    if (diff < MIN_UPLOAD_INTERVAL) {
      return {
        canUpload: false,
        remainingSeconds: Math.ceil((MIN_UPLOAD_INTERVAL - diff) / 1000),
      };
    }

    return { canUpload: true };
  }
}
