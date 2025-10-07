import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebaseConfig';
import { StatusResponse } from '@/functions/src';

class UserClient {
  public addPushToken = async (token: string): Promise<StatusResponse> => {
    if (!token) return { success: false };
    const cloudFunction = httpsCallable<{ token: string }, StatusResponse>(
      functions,
      'addPushTokenSecondGen'
    );
    const { data: response } = await cloudFunction({ token });
    return response;
  };

  public removePushToken = async (token: string): Promise<StatusResponse> => {
    if (!token) return { success: false };
    const cloudFunction = httpsCallable<{ token: string }, StatusResponse>(
      functions,
      'removePushTokenSecondGen'
    );
    const { data: response } = await cloudFunction({ token });
    return response;
  };

  public canUploadPhoto = async (): Promise<{
    canUpload: boolean;
    remainingSeconds?: number;
  }> => {
    const cloudFunction = httpsCallable<
      void,
      { canUpload: boolean; remainingSeconds?: number }
    >(functions, 'canUploadPhoto');
    const { data } = await cloudFunction();
    return data;
  };
}

const userClient = new UserClient();
export default userClient;
