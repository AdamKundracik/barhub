import * as admin from 'firebase-admin';

export interface ReportDocument {
  postId: string;
  userId: string;
  reason: string;
  creationTime: FirebaseFirestore.Timestamp;
}

export interface ReportResponse {
  report: ReportDocument & { id: string };
}

export class ReportService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async reportPost(
    userId: string,
    postId: string,
    reason: string
  ): Promise<ReportResponse> {
    if (!userId || !postId || !reason) {
      throw new Error('Missing postId, userId or reason');
    }

    const creationTime = admin.firestore.Timestamp.now();

    const reportDoc: ReportDocument = {
      postId,
      userId,
      reason,
      creationTime,
    };

    const reportRef = await this.db.collection('reports').add(reportDoc);
    const savedSnapshot = await reportRef.get();
    const savedData = savedSnapshot.data() as ReportDocument;

    return {
      report: {
        ...savedData,
        id: reportRef.id,
      },
    };
  }
}
