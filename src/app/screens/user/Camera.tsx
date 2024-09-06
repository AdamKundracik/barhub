import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { commonAppStyles } from '../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { Icons } from '../../utils/icons/icons';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useQueryClient } from 'react-query';
import { useUploadingStateManagement } from '../../utils/hooks/useUploadingStateManagement';
import { uploadImageAsync } from '../../utils/helper-functions/helperFunctions';
import { sendPushNotificationResponse } from '../../utils/services/notofications-handler';
import { useUserContext } from '../../providers/UserProvider';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { PlaceDetailsResponse } from '../../utils/types/types';
import { setUser } from '../../utils/services/functions';

export const CameraScreen = () => {
  const route = useRoute();
  const routeResponse = route.params as {
    placeId: string;
    senderToken: string;
  };

  const { userData } = useUserContext();
  const queryClient = useQueryClient();
  const { setUploadingState } = useUploadingStateManagement();

  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const camera = useRef(null);
  const [image, setImage] = useState<string | null>(null); // Local state for image

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (image) {
          setImage(null);
        }
      };
    }, [image])
  );

  const captureImage = async () => {
    if (permission?.granted && camera.current) {
      try {
        const data = await camera.current.takePictureAsync();
        console.log(data.uri);
        setImage(data.uri);
      } catch (error) {
        console.log(error);
      }
    }
  };

  async function saveImageFromCamera() {
    if (!image) {
      console.error('No image');
      return;
    }

    if (routeResponse?.placeId) {
      const token = userData?.pushToken;
      const place: PlaceDetailsResponse = await fetchPlaceDetails(
        routeResponse.placeId
      );
      if (!token) {
        return;
      }
      setIsSaving(true);
      await uploadImageAsync(
        image,
        setUploadingState,
        routeResponse?.placeId,
        place.result.name,
        place.result.formatted_address
      ).then(() => {
        navigation.navigate('Feed');
        setIsSaving(false);
        sendPushNotificationResponse(
          routeResponse.senderToken,
          routeResponse.placeId
        ).then();
      });
      await setUser({
        lastUploadedPost: new Date(),
      });
    } else {
      navigation.navigate('PhotoResolver', { image: image });
    }
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>{t('noPermission')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.grantPermission}>
        <Text
          style={{
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
          }}
        >
          {t('permissionToCameraRequest')}
        </Text>
        <Button onPress={requestPermission} title={t('grantPermission')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!image ? (
        <CameraView
          style={styles.camera}
          ref={camera}
          facing={facing}
          hasTVPreferredFocus={true}
          flash={flash}
        >
          <SafeAreaView style={{ backgroundColor: 'black' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              >
                <FontAwesomeIcon
                  icon={Icons.Bolt}
                  size={24}
                  color={flash === 'on' ? 'white' : 'grey'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleCameraFacing}>
                <FontAwesomeIcon
                  icon={Icons.Rotate}
                  size={24}
                  color={'white'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={captureImage}>
              <View style={styles.shotButton}></View>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={styles.container}>
            <Image source={{ uri: image }} style={styles.image} />
            {!isSaving && (
              <View style={styles.overlay}>
                <View>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setImage(null);
                    }}
                  >
                    <Text
                      style={[
                        commonAppStyles.textPrimary,
                        {
                          fontWeight: 'bold',
                          fontSize: 30,
                        },
                      ]}
                    >
                      {t('retake')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={saveImageFromCamera}
                  >
                    <Text
                      style={[
                        commonAppStyles.textPrimary,
                        {
                          fontWeight: 'bold',
                          fontSize: 30,
                        },
                      ]}
                    >
                      {t('save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          {isSaving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  shotButton: {
    height: 80,
    width: 80,
    backgroundColor: 'white',
    borderRadius: 50,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 0,
    flex: 1,
    alignItems: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantPermission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020213',
  },
});
export default CameraScreen;
