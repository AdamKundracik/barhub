export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum OccupancyEnum {
  FULL = 'FULL',
  ALMOST_FULL = 'ALMOST_FULL',
  SPARSELY_OCCUPIED = 'SPARSELY_OCCUPIED',
  EMPTY = 'EMPTY',
}

export type OccupancyTypes =
  | 'FULL'
  | 'ALMOST_FULL'
  | 'SPARSELY_OCCUPIED'
  | 'EMPTY';

export type PlaceType =
  | 'bar'
  | 'bakery'
  | 'bowling_alley'
  | 'cafe'
  | 'casino'
  | 'night_club'
  | 'restaurant'
  | 'tourist_attraction';
