import { ServiceCodeEnum, ServiceStatusEnum } from './functions-types';

export const MISSING_REQUIRED_REQUEST_PARAMS = {
  status: ServiceStatusEnum.ERROR,
  code: ServiceCodeEnum.BAD_REQUEST,
  message: 'Invalid or missing required request parameters!',
};

export const googleAPIKey = "AIzaSyAMoNX-aQzrjpnZ0KjYegeyhV47C8rRBVU";
export const radius = 80
