import { InfinityScrollPost } from '@/src/app/types';

export enum ServiceStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum ServiceCodeEnum {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
}
export type GetFreshnessContentResult = {
  status: ServiceStatusEnum;
  code: ServiceCodeEnum;
  message?: string;
  data?: InfinityScrollPost;
};
