import { ServiceCodeEnum, ServiceStatusEnum } from '../types/functions-types';

export const MISSING_REQUIRED_REQUEST_PARAMS = {
  status: ServiceStatusEnum.ERROR,
  code: ServiceCodeEnum.BAD_REQUEST,
  message: 'Invalid or missing required request parameters!',
};

export const radius = 200;

//max_distance - means maximum distance from user posting photo to nearest selected place
export const max_distance = 25;
