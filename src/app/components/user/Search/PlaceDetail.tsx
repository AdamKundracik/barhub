import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modal } from '../../shared/Modal';
import { Place, PlaceDetailsResponse } from '../../../utils/types/types';
import { commonAppStyles, formStyles } from '../../../utils/styles/styles';
import { fetchPlaceDetails } from '../../../utils/helper-functions/fetchPlaceDetail';
import { fetchPlacePhotos } from '../../../utils/helper-functions/fetchPlacePhotos';
import { useQueryClient } from 'react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { uploadImageAsync } from '../../../utils/helper-functions/helperFunctions';
import { useTranslation } from 'react-i18next';
import { useUploadingStateManagement } from '../../../utils/hooks/useUploadingStateManagement';
import { useUserContext } from '../../../providers/UserProvider';
import { setUser } from '../../../utils/services/functions';
import { haversineDistance } from '../../../utils/helper-functions/distanceBetweenPoints';
import { max_distance } from '../../../utils/helper-functions/constants';

type PlaceDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  image: string | null;
};

export const PlaceDetail = memo(
  ({ isOpen, onClose, place, image }: PlaceDetailModalProps) => {
    const { t } = useTranslation();

    const navigation = useNavigation<NavigationProp<UserStackList>>();
    const { location } = useUserContext();
    const [isSaving, setIsSaving] = useState(false);

    const { setUploadingState } = useUploadingStateManagement();

    async function savePost() {
      try {
        const calculatedDistance = Math.round(
          haversineDistance(
            location?.latitude!,
            location?.longitude!,
            place?.location.latitude!,
            place?.location.longitude!
          )
        );
        if (calculatedDistance <= max_distance) {
          if (image && place?.id) {
            setIsSaving(true);
            setUploadingState.mutate(true);
            uploadImageAsync(
              image,
              setUploadingState,
              place?.id,
              place.displayName.text,
              place.formattedAddress
            ).then(() => {
              onClose();
              navigation.navigate('Feed');
            });
            setUser({ lastUploadedPost: new Date().toISOString() });
          }
        } else {
          Alert.alert(
            t('distance-warning-title'),
            t('distance-warning-message')
          );
        }
      } catch (errors) {
        console.error(errors);
      }
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true}>
        <Text>{place?.displayName.text} ? </Text>
        <View style={{ padding: 10 }}>
          <TouchableOpacity
            style={formStyles.buttonSecondary}
            onPress={savePost}
          >
            {isSaving ? (
              <ActivityIndicator />
            ) : (
              <Text style={commonAppStyles.textPrimary}>{t('choose')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  opening_hours: {
    paddingVertical: 10,
    flex: 1,
  },
  capturedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
