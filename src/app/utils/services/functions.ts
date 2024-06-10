import {httpsCallable} from 'firebase/functions';
import {Post, User} from "../types/types";
import {functions} from "../../../../firebaseConfig";
import {
    EmptyDataResponse,
    EmptyDataResult,
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

export const setUser = async (data: Partial<User>): Promise<EmptyDataResult> => {
    if (!data) return MISSING_REQUIRED_REQUEST_PARAMS;
    console.log(data)
    const cloudFunction = httpsCallable<SetDocumentFromCollectionRequest['data']['data']>(functions, 'setUser');
    const {data: response} = await cloudFunction({
        ...data,
    }) as unknown as EmptyDataResponse;
    return response;
}

export const getCurrentUser = async (userId: string): Promise<GetUserResult> => {
    if (!userId) return MISSING_REQUIRED_REQUEST_PARAMS;
    const cloudFunction = httpsCallable(functions, 'getCurrentUser');
    const response = await cloudFunction(
        userId
    ) as unknown as GetUserResult;
    return response
}

