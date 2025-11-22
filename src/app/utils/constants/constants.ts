import { ServiceCodeEnum, ServiceStatusEnum } from '../types/functions-types';

export const MISSING_REQUIRED_REQUEST_PARAMS = {
  status: ServiceStatusEnum.ERROR,
  code: ServiceCodeEnum.BAD_REQUEST,
  message: 'Invalid or missing required request parameters!',
};

export const radius = 30;
export const mapSearchRadius = 100;
