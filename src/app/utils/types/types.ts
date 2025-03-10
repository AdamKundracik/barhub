export enum TabsTypes {
  camera = 'Camera',
  account = 'Account',
  placeSearch = 'PlaceSearch',
}

export type Settings = {
  // FOR ADDITIONAL SETTINGS
};

export enum OccupancyEnum {
  FULL = 'FULL',
  ALMOST_FULL = 'ALMOST_FULL',
  SPARSELY_OCCUPIED = 'SPARSELY_OCCUPIED',
  EMPTY = 'EMPTY',
}

export type DisplayName = {
  languageCode: string;
  text: string;
};

export type Place = {
  displayName: DisplayName;
  formattedAddress: string;
  id: string;
  location: LocationType;
  types: string[];
};

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

export interface PlaceDetail {
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
  result: PlaceDetail;
  status: string;
}

export type LocationType = {
  latitude: number;
  longitude: number;
};

export type GeoPointType = {
  _lat: number;
  _long: number;
};

export interface Match {
  endOffset: number;
}

export interface Text {
  text: string;
  matches: Match[];
}

export interface MainText {
  text: string;
  matches: Match[];
}

export interface StructuredFormat {
  mainText: MainText;
  secondaryText: {
    text: string;
  };
}

export interface PlacePrediction {
  place: string;
  placeId: string;
  text: Text;
  structuredFormat: StructuredFormat;
  types: string[];
}

export interface Suggestion {
  placePrediction: PlacePrediction;
}

export interface AutocompleteResponse {
  suggestions: Suggestion[];
}

export type PlaceType =
  | 'bar'
  | 'bakery'
  | 'bowling_alley'
  | 'cafe'
  | 'casino'
  | 'night_club'
  | 'restaurant'
  | 'tourist_attraction';

export type OccupancyTypes =
  | 'FULL'
  | 'ALMOST_FULL'
  | 'SPARSELY_OCCUPIED'
  | 'EMPTY';

export type FirebaseTimestamp = {
  seconds?: number;
  _seconds?: number;
  nanoseconds?: number;
  _nanoseconds?: number;
};
