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
};

export type UserAuthStackParamList = {
    LoginUser: undefined;
    NumberVerification: {
        verification: string;
        phoneNumber: string;
    };
    RegisterUser: undefined;
};

export type DriverStackParamList = {
    Domov: undefined,
    Profile: undefined,
    Statistics: undefined,
    Settings: undefined,
    NavigationList: undefined
};

export type UserStackParamList = {
    Home: undefined,
    Profile: undefined;
    History: undefined;
    Payment: undefined;
    Settings: undefined;
};

export type Settings = {
    darkMode?: boolean;
    navigationApp?: string;
    searchRadius: number;
}

export type User = {
    uid: string;
    email: string;
    createdAt: number;
    name: string;
};

export type UserSettings = {
    darkMode?: boolean
}

export enum AccountTypeEnum {
    USER = 'USER',
    DRIVER = 'DRIVER',
    PROVIDER = 'PROVIDER',
}

export enum UserStatusEnum {
    IDLE = 'IDLE',
    WAITING = 'WAITING',
    TRANSPORTING = 'TRANSPORTING',
}

export type LocationType = {
    latitude: number;
    longitude: number;
};


export type Provider = {
    uid: string;
    name: string;
    email: string;
    ico: string;
    phoneNumber?: string;
    createdAt: number;
    city: string;
    accountType: AccountTypeEnum;
};

export type Driver = {
    uid: string;
    name: string;
    email?: string;
    phoneNumber: string;
    createdAt: number;
    location?: LocationType;
    providerId: string;
    accountType: AccountTypeEnum;
    status: DriverStatusEnum;
    invitedAt: number;
    settings?: Settings;
    invitationCode?: string;
    invitationId?: string;
};

export enum DriverStatusEnum {
    NOT_ACTIVATED = 'NOT_ACTIVATED',
    AVAILABLE = 'AVAILABLE',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
    DRIVING = 'DRIVING',
    OFFLINE = 'OFFLINE',
    WAITING_FOR_ACCEPT = "WAITING_FOR_ACCEPT"
}

export type Vehicle = {
    id: string;
    provider: string;
    status: VehicleStatusEnum;
    driver: string | null;
    name: string;
    manufactured: string;
    createdAt: number;
};

export enum VehicleStatusEnum {
    AVAILABLE = 'AVAILABLE',
    DRIVING = 'DRIVING',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export type Ride = {
    id: string;
    userId: string;
    driverId?: string;
    providerId?: string;
    carId?: string;
    status: RideStatusEnum;
    startLocation: LocationType;
    endLocation: LocationType;
    userLocation?: LocationType;
    driverLocation?: LocationType;
    allowedProviders: string[];
    startAddress: string,
    endAddress: string;
    estTime: number;
    distance: number;
    driverEstTime: number;
    driverDistance: number;
    blockedDrivers: string[];
    price: number;
    createdAt: number;
    endedAt?: number;
    acceptedAt?: number;
    startedAt?: number;
};

export enum RideStatusEnum {
    REQUESTED = 'REQUESTED',
    ACCEPTED = 'ACCEPTED',
    CANCELLED_BY_USER = 'CANCELLED_BY_USER',
    CANCELLED_BY_DRIVER = 'CANCELLED_BY_DRIVER',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    PLANNED = 'PLANNED',
}

