import * as admin from 'firebase-admin';

export const POINTS_PER_PHOTO = 10;
export const POINTS_PER_LIKE = 2;
export const POINTS_PER_COMMENT = 3;

export class LeaderboardService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  private leaderboardRef(userId: string) {
    return this.db.collection('leaderboard').doc(userId);
  }

  // Pridanie bodov za fotku
  async addPhotoPoints(userId: string) {
    return this.incrementPoints(userId, POINTS_PER_PHOTO);
  }

  // Pridanie bodov za like
  async addLikePoints(userId: string) {
    return this.incrementPoints(userId, POINTS_PER_LIKE);
  }

  // Odčítanie bodov za like (unlike)
  async removeLikePoints(userId: string) {
    return this.incrementPoints(userId, -POINTS_PER_LIKE);
  }

  // Pridanie bodov za komentár
  async addCommentPoints(userId: string) {
    return this.incrementPoints(userId, POINTS_PER_COMMENT);
  }

  // Univerzálna metóda pre increment/decrement bodov
  private async incrementPoints(userId: string, points: number) {
    const ref = this.leaderboardRef(userId);
    await ref.set(
      {
        points: admin.firestore.FieldValue.increment(points),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true, pointsAdded: points };
  }

  // Voliteľne: získanie aktuálneho skóre používateľa
  async getUserPoints(userId: string) {
    const doc = await this.leaderboardRef(userId).get();
    return doc.exists ? doc.data()?.points || 0 : 0;
  }
}
