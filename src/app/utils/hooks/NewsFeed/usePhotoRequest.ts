import { useState } from 'react';
import { usePlaceStore } from '../../store/placesStore';
import { fetchPlaceDetails } from '../../helper-functions/fetchPlacesAPI';
import { sendRequestNotificationToRecipients } from '@/src/app/utils/services/notifications-service';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { LocationType } from '@/src/app/utils/types/types';
import { useCustomToast } from '@/src/app/components/shared/Toaster';

export const usePhotoRequest = () => {
  const [isRequestingPhoto, setIsRequestingPhoto] = useState(false);
  const { placeId, placeName, setPlaceDetail } = usePlaceStore();
  const { currentPushToken } = useUserStore();
  const { showSuccessToast } = useCustomToast();

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

        const success = await sendRequestNotificationToRecipients(
          placeId,
          placeName,
          location,
          currentPushToken ?? ''
        );

        if (success) {
          showSuccessToast('Success');
        }
      }
    } catch (error) {
      console.error('Error requesting photo:', error);
    } finally {
      setIsRequestingPhoto(false);
    }
  };

  return {
    requestPhoto,
    isRequestingPhoto,
  };
};
