import { useState } from 'react';
import { usePlaceStore } from '../../store/placesStore';
import { fetchPlaceDetails } from '../../api/fetchPlacesAPI';
import { sendRequestNotificationToRecipients } from '@/src/app/utils/services/notifications-service';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { LocationType } from '@/src/app/utils/types/types';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useTranslation } from 'react-i18next';

export const usePhotoRequest = () => {
  const [isRequestingPhoto, setIsRequestingPhoto] = useState(false);
  const { placeId, placeName, setPlaceDetail } = usePlaceStore();
  const { currentPushToken } = useUserStore();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();

  const requestPhoto = async () => {
    if (!placeId || !placeName || isRequestingPhoto) return;

    setIsRequestingPhoto(true);
    try {
      const detail = await fetchPlaceDetails(placeId);
      setPlaceDetail(detail);

      if (detail) {
        const location: LocationType = {
          latitude: detail.geometry.location?.lat,
          longitude: detail.geometry.location?.lng,
        };

        await sendRequestNotificationToRecipients(
          placeId,
          placeName,
          location,
          currentPushToken ?? ''
        );

        showSuccessToast(
          t('sendRequest.successTitle'),
          t('sendRequest.successDescription')
        );
      }
    } catch (error: any) {
      const isNoUsersError =
        error?.status === 404 ||
        error?.errorCode === 'NO_USERS_FOUND_IN_RADIUS' ||
        error?.message?.toLowerCase().includes('no users found') ||
        error?.message?.toLowerCase().includes('users found in radius');

      if (isNoUsersError) {
        showErrorToast(
          t('error') || 'Error',
          t('sendRequest.noUsersFound') || 'No users found in the area'
        );
      } else {
        showErrorToast(
          t('error') || 'Error',
          error?.message || t('try-again-later') || 'Try again later'
        );
      }
    } finally {
      setIsRequestingPhoto(false);
    }
  };

  return {
    requestPhoto,
    isRequestingPhoto,
  };
};
