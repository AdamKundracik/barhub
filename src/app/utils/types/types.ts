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

export type User = {
    uid: string;
    email: string;
    createdAt: number;
    name: string;
};


export type LocationType = {
    latitude: number;
    longitude: number;
};



