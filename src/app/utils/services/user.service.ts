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
}

const userClient = new UserClient();
export default userClient;
