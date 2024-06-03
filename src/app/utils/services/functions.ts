import {httpsCallable} from 'firebase/functions';
import {Post} from "../types/types";
import {functions} from "../../../../firebaseConfig";
import {
    EmptyDataResponse,
    EmptyDataResult,
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
