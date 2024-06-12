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
import { Modal } from '../shared/Modal';
import { Place, PlaceDetailsResponse } from '../../utils/types/types';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { fetchPlacePhotos } from '../../utils/helper-functions/fetchPlacePhotos';
import { getDistanceData } from '../../utils/helper-functions/getDistanceData';
import { useAuthContext } from '../../providers/AuthProvider';
import { useImageManagement } from '../../utils/hooks/useImageManagement';
import { useQueryClient } from 'react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { uploadImageAsync } from '../../utils/helper-functions/helperFunctions';
import { max_distance } from '../../utils/helper-functions/constants';
import { useTranslation } from 'react-i18next';

type PlaceDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
};

export const PlaceDetail = memo(
  ({ isOpen, onClose, place }: PlaceDetailModalProps) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const navigation = useNavigation<NavigationProp<UserStackList>>();
    const { location } = useAuthContext();
    const [placeDetail, setPlaceDetail] = useState<PlaceDetailsResponse | null>(
      null
    );
    const [isFetching, setIsFetching] = useState(false);
    const [photoUrls, setPhotourls] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const image = queryClient.getQueryData<string>('capturedImage');
    const { deleteImage } = useImageManagement();

    useEffect(() => {
      setIsFetching(true);

      async function fetchData() {
        if (place) {
          const detailData = await fetchPlaceDetails(place.id);
          setPlaceDetail(detailData);
          return detailData;
        }
      }

      async function fetchPhotos(placeData: PlaceDetailsResponse) {
        if (placeData?.result.photos) {
          const fetchPhotoPromises = placeData.result.photos.map(photo => {
            return fetchPlacePhotos(
              photo.photo_reference,
              photo.width,
              photo.height
            );
          });
          const fetchedUrls = await Promise.all(fetchPhotoPromises);
          const validUrls = fetchedUrls.filter(url => url !== undefined);
          setPhotourls(validUrls as string[]);
        }
      }

      fetchData().then(placeData => {
        if (placeData) {
          fetchPhotos(placeData).then(() => {
            setIsFetching(false);
          });
        }
      });
    }, [place]);

    async function savePost() {
      try {
        const data = await getDistanceData({
          startLocation: location!,
          endLocation: place?.location!,
        });
        const calculatedDistance = data.data?.distance;
        if (calculatedDistance && calculatedDistance < max_distance) {
          if (image) {
            setIsSaving(true);
            uploadImageAsync(image).then(() => {
              onClose();
              navigation.navigate('Feed');
              deleteImage.mutate();
            });
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
        {place && (
          <View style={{ padding: 10 }}>
            {isFetching ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator />
              </View>
            ) : (
              <View>
                <Text style={{ marginBottom: '3%', fontWeight: 'bold' }}>
                  {placeDetail?.result?.name}
                </Text>
                <Text>{placeDetail?.result?.formatted_address}</Text>
                <View style={styles.opening_hours}>
                  {placeDetail?.result.opening_hours &&
                  placeDetail.result.opening_hours.weekday_text ? (
                    placeDetail.result.opening_hours.weekday_text.map(
                      (text, index) => <Text key={index}>{text}</Text>
                    )
                  ) : (
                    <Text>{t('no-opening-hours')}</Text>
                  )}
                </View>
                <ScrollView horizontal={true}>
                  {photoUrls?.map((url, index) => (
                    <Image
                      key={index}
                      source={{ uri: url, height: 150, width: 150 }}
                      style={{ marginHorizontal: 3 }}
                    />
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={formStyles.buttonSecondary}
                  onPress={savePost}
                >
                  {isSaving ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={commonAppStyles.textPrimary}>
                      {t('choose')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingTop: '10%',
  },
  vehicleItem: {
    width: 300,
    height: 50,
    borderRadius: 12.5,
    backgroundColor: 'white',
    borderColor: 'rgba(0,0,0,0.4)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
  },
  selectedVehicleItem: {
    width: 300,
    height: 50,
    borderRadius: 12.5,
    backgroundColor: 'rgba(101,214,255,0.67)',
    borderColor: 'rgba(0,0,0,0.2)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
  },
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
