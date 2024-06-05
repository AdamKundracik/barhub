export type AuthStackParamList = {
    LoginDriver: undefined;
    RegisterDriver: { id: string };
    NumberVerificationDriver: {
        verification: string;
        phoneNumber: string;
        name?: string;
        email?: string;
        invitationId?: string;
    };
}; // EXAMPLE FOR NAVIGATION


export type Settings = {
    // FOR ADDITIONAL SETTINGS
}

export type Post = {
    creationTime: Date;
    fileId: string;
    folderId: string;
    name: string;
    uid: string
}

export interface UserRecord {
    customClaims: { [key: string]: any };
    disabled: boolean;
    displayName: string | null;
    email: string;
    emailVerified: boolean;
    metadata: {
        creationTime: string;
        lastSignInTime: string;
    };
    passwordHash: string | null;
    passwordSalt: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerData: Array<{
        email: string;
        providerId: string;
        uid: string;
    }>;
    tokensValidAfterTime: string | null;
    uid: string;
}

export interface User extends UserRecord {
    dateOfBirth: Date
};


export type LocationType = {
    latitude: number;
    longitude: number;
};



