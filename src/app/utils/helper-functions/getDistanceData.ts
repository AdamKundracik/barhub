import { DistanceMatrixResponse, GetDistanceDataRequest } from '../types/types';
import { ServiceStatusEnum } from './functions-types';
import { distanceMatrixGoogleApiKey } from './constants';

export const getDistanceData = async (params: GetDistanceDataRequest) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${params.startLocation.latitude},${params.startLocation.longitude}&destinations=${params.endLocation.latitude},${params.endLocation.longitude}&mode=walking&key=${distanceMatrixGoogleApiKey}`
    );

    if (!response.ok) {
      console.error('Failed to fetch distance matrix:', response);
    }

    const dataResponse: DistanceMatrixResponse = await response.json();
    const data = {
      distance: dataResponse.rows[0].elements[0].distance.value,
      estTime: dataResponse.rows[0].elements[0].duration.value,
    };

    return { data, status: ServiceStatusEnum.SUCCESS };
  } catch (e) {
    return {
      status: ServiceStatusEnum.ERROR,
      message: e,
    };
  }
};
