import {httpsCallable} from 'firebase/functions';
import {Post} from "../types/types";
import {functions} from "../../../../firebaseConfig";
import {
    EmptyDataResponse,
    EmptyDataResult,
    GetUserResponse,
    GetUserResult,
    SetDocumentFromCollectionRequest
} from "../helper-functions/functions-types";
import {MISSING_REQUIRED_REQUEST_PARAMS} from "../helper-functions/constants";

export const savePost = async (data: Partial<Post>): Promise<EmptyDataResult> => {
    if (!data) return MISSING_REQUIRED_REQUEST_PARAMS;
    const cloudFunction = httpsCallable<SetDocumentFromCollectionRequest['data']['data']>(functions, 'savePost');
    const {data: response} = await cloudFunction({
        data: data,
    }) as unknown as EmptyDataResponse;
    return response;
};

export const getCurrentUser = async (userId: string): Promise<GetUserResult> => {
    if (!userId) return MISSING_REQUIRED_REQUEST_PARAMS;
    const cloudFunction = httpsCallable(functions, 'getCurrentUser');
    const {data: response} = await cloudFunction(
        userId
    ) as unknown as GetUserResponse;
    return response
}

