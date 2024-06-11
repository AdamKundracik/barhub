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
};

export type Post = {
  creationTime: Date;
  fileId: string;
  folderId: string;
  name: string;
  uid: string;
};

export type LocationType = {
  latitude: number;
  longitude: number;
};
