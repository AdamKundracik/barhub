import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

interface PushTokenData {
  userId: string;
  token: string;
}

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
}
