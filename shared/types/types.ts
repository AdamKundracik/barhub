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


