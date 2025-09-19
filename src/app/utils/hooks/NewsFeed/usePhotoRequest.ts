import { useState } from 'react';
import { sendRequestNotification } from '../../functions/notofications-handler';
import { usePlaceStore } from '../../store/placesStore';
import { useUserContext } from '../../../providers/UserProvider';
import { fetchPlaceDetails } from '../../helper-functions/fetchPlacesAPI';
import { sendNotification } from '@/src/app/utils/services/notifications-service';

export const usePhotoRequest = () => {
  const [isRequestingPhoto, setIsRequestingPhoto] = useState(false);
  const { placeId, placeName, setPlaceDetail } = usePlaceStore();
  const { userData } = useUserContext();

  const requestPhoto = async () => {
    if (!placeId || !placeName || isRequestingPhoto) return;

    setIsRequestingPhoto(true);
    try {
      const senderToken = userData?.pushToken;
      const detail = await fetchPlaceDetails(placeId);
      setPlaceDetail(detail);

      if (detail) {
        const tokens = await sendNotification(
          detail.geometry.location?.lat,
          detail.geometry.location?.lng
        );

        console.log('TOKENS', tokens);

        const notificationPromises =
          tokens?.map(token =>
            sendRequestNotification(
              token,
              placeId,
              placeName,
              senderToken ?? ''
            )
          ) || [];

        await Promise.all(notificationPromises);
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
