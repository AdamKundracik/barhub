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

  async getTopUsersWithCurrent(uid: string) {
    // 1. Získať top 100 používateľov podľa bodov
    const leaderboardSnapshot = await this.db
      .collection('leaderboard')
      .orderBy('points', 'desc')
      .limit(100)
      .get();

    const topUsers = leaderboardSnapshot.docs.map(doc => ({
      userId: doc.id,
      points: doc.data().points || 0,
    }));

    const topUserIds = topUsers.map(u => u.userId);

    // 2. Načítať info pre top 100 používateľov
    const usersSnapshot = await this.db
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', topUserIds)
      .get();

    const usersMap: Record<string, { displayName: string; photoUrl: string }> =
      {};
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      usersMap[doc.id] = {
        displayName: data.displayName || 'Unknown',
        photoUrl: data.photoURL || '',
      };
    });

    const topWithUserInfo = topUsers.map(u => ({
      userId: u.userId,
      points: u.points,
      displayName: usersMap[u.userId]?.displayName || 'Unknown',
      photoUrl: usersMap[u.userId]?.photoUrl || '',
    }));

    // 3. Získať current user priamo, mimo top 100 alebo z top 100
    let currentUser = null;

    if (topUserIds.includes(uid)) {
      // User je v top 100 → vyberieme jeho info z topWithUserInfo
      const topUser = topWithUserInfo.find(u => u.userId === uid)!;
      currentUser = { ...topUser };
    } else {
      // User nie je v top 100 → načítame ho samostatne
      const currentUserDoc = await this.db.collection('users').doc(uid).get();
      const currentLeaderboardDoc = await this.db
        .collection('leaderboard')
        .doc(uid)
        .get();

      if (currentUserDoc.exists) {
        const data = currentUserDoc.data();
        currentUser = {
          userId: uid,
          displayName: data?.displayName || 'Unknown',
          photoUrl: data?.photoURL || '',
          points: currentLeaderboardDoc.exists
            ? currentLeaderboardDoc.data()?.points || 0
            : 0,
        };
      }
    }

    return { topUsers: topWithUserInfo, currentUser };
  }
}
