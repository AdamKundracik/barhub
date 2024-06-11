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

export type DisplayName = {
    "languageCode": string,
    "text": string
}

export type Place = {
    displayName: DisplayName
    "formattedAddress": string,
    "id": string
    "location": LocationType
    "types": string[]
}

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

interface Location {
    lat: number;
    lng: number;
}

interface Viewport {
    northeast: Location;
    southwest: Location;
}

interface Geometry {
    location: Location;
    viewport: Viewport;
}

interface OpeningHoursPeriod {
    close: { day: number; time: string };
    open: { day: number; time: string };
}

interface OpeningHours {
    open_now: boolean;
    periods: OpeningHoursPeriod[];
    weekday_text: string[];
}

interface Photo {
    height: number;
    html_attributions: string[];
    photo_reference: string;
    width: number;
}

interface PlusCode {
    compound_code: string;
    global_code: string;
}

interface Review {
    author_name: string;
    author_url: string;
    language: string;
    profile_photo_url: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
}

interface Result {
    address_components: AddressComponent[];
    adr_address: string;
    business_status: string;
    formatted_address: string;
    formatted_phone_number: string;
    geometry: Geometry;
    icon: string;
    icon_background_color: string;
    icon_mask_base_uri: string;
    international_phone_number: string;
    name: string;
    opening_hours: OpeningHours;
    photos: Photo[];
    place_id: string;
    plus_code: PlusCode;
    rating: number;
    reference: string;
    reviews: Review[];
    types: string[];
    url: string;
    user_ratings_total: number;
    utc_offset: number;
    vicinity: string;
    website: string;
}

export interface PlaceDetailsResponse {
    html_attributions: any[];
    result: Result;
    status: string;
}


export type LocationType = {
    latitude: number;
    longitude: number;
};



