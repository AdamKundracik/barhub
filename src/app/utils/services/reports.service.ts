import { httpsCallable } from 'firebase/functions';
import { ReportResponse } from '@/functions/src/services/reportService';
import { functions } from '@/firebaseConfig';

class ReportClient {
  public reportPost = async (
    postId: string,
    userId: string,
    reason: string
  ): Promise<ReportResponse> => {
    const cloudFunction = httpsCallable<
      { postId: string; userId: string; reason: string },
      ReportResponse
    >(functions, 'reportPost');

    const response = await cloudFunction({ postId, userId, reason });
    return response.data;
  };
}

const reportClient = new ReportClient();
export default reportClient;
