import {UserRecord} from "../types/types";

export const COLLECTION = {
    USERS: 'users',
    POSTS: 'posts'
} as const;

export enum ServiceStatusEnum {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
}

export enum ServiceCodeEnum {
    SUCCESS = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404
}

export type GetDocumentFromCollectionRequest = {
    data: GetDocumentFromCollectionRequestData;
    functionName: string;
};

export type GetDocumentFromCollectionRequestData = {
    collectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    documentId: string;
};

export type FindDocumentInCollectionRequest = {
    data: FindDocumentInCollectionRequestData;
    functionName: string;
};

export type FindDocumentInCollectionRequestData = {
    field: string;
    isEqualTo: unknown;
};

export type SetDocumentFromCollectionRequest = {
    data: SetDocumentFromCollectionRequestData;
    functionName: string;
};

export type SetDocumentFromCollectionRequestData = {
    collectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    documentId: string;
    data: object;
};

export type RemoveDocumentFromCollectionRequest = {
    data: RemoveDocumentFromCollectionRequestData;
    functionName: string;
};

export type RemoveDocumentFromCollectionRequestData = {
    collectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    documentId: string;
};

export type MoveDocumentRequest = {
    data: MoveDocumentRequestData;
    functionName: string;
};

export type MoveDocumentRequestData = {
    fromCollectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    toCollectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    documentId: string;
    newDocumentId?: string;
};

export type CreateLogRequest = {
    data: CreateLogRequestData;
    functionName: string;
};

export type CreateLogRequestData = {
    collectionId: (typeof COLLECTION)[keyof typeof COLLECTION];
    documentId: string;
};

export type EmptyDataResponse = {
    data: EmptyDataResult;
};

export type EmptyDataResult = {
    status: ServiceStatusEnum;
    code: ServiceCodeEnum;
    message?: string;
};

export type GetUserResponse = {
    data: GetUserResult;
}

export type User = {
    uid: string;
    email: string;
    createdAt: number;
    name: string;
};

export type GetUserResult = {
    status: ServiceStatusEnum;
    code: ServiceCodeEnum;
    message?: string;
    data?: UserRecord;
}


export type SignInUserRequest = {
    data: SignInUserRequestData;
}

export type SignInUserRequestData = {
    phoneNumber: string;
}

export type SavePostRequest = {
    creationTime: Date;
    fileId: string
    name: string;
    uid: string
}

export type SignInDriverRequest = {
    data: SignInDriverRequestData;
}

export type SignInDriverRequestData = {
    name: string;
    phoneNumber: string;
    invitationId?: string
    invitationCode?: string
}


export type FinishRideRequestData = {
    rideId: string
}

export type SignInProviderRequest = {
    data: SignInProviderRequestData;
}

export type SignInProviderRequestData = {
    uid: string;
    city: string;
    email: string;
    ico: string;
    name: string;
}

export type DistanceMatrixResponse = {
    status: string;
    rows: {
        elements: {
            distance: {
                text: string;
                value: number;
            };
            duration: {
                text: string;
                value: number;
            };
            status: string;
        }[];
    }[];
}





















