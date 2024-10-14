import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Layout from '../../../components/user/Shared/Layout';
import Device from 'react-native-device-info';
import {
  iconInactiveColor,
  postBgColor,
  primaryBgColor,
  primaryColor,
} from '../../../utils/styles/colors';
import { occupacyOptions, Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../../../utils/styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useUploadingStateManagement } from '../../../utils/hooks/useUploadingStateManagement';
import { uploadImageAsync } from '../../../utils/helper-functions/helperFunctions';
import { setUser } from '../../../utils/services/functions';
import LoadingIndicator from '../../../components/user/NewsFeed/LoadingIndicator';
import { sendPushNotificationResponse } from '../../../utils/services/notofications-handler';

type SummaryProps = {
  image: string;
  place: Place;
  senderToken?: string;
};

const isTablet = Device.isTablet();
const width = Dimensions.get('window').width;

export const PostSummary = ({ route }: any) => {
  const { t } = useTranslation();
  const routeParams = route.params as SummaryProps; // Define route params
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [selectedOccupancy, setSelectedOccupancy] = useState(
    occupacyOptions.FULL
  ); // Default value using enum
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown toggle state
  const [image, setImage] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [senderToken, setSenderToken] = useState<string | null>(null);

  useEffect(() => {
    if (routeParams?.image && routeParams?.place) {
      setImage(routeParams.image); // Set the place when passed from PlaceSearch
      setPlace(routeParams.place);
      setSenderToken(routeParams.senderToken ?? null);
    }
  }, [routeParams]);

  const occupancyLabels = {
    [occupacyOptions.FULL]: t('full'),
    [occupacyOptions.HALF_FULL]: t('half-full'),
    [occupacyOptions.HALF_EMPTY]: t('half-empty'),
    [occupacyOptions.EMPTY]: t('empty'),
  };

  const options = Object.values(occupancyLabels); // Dropdown options

  const handleSelect = (option: occupacyOptions) => {
    setSelectedOccupancy(option); // Set selected option
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  // Function to handle outside clicks
  const handleOutsideClick = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false); // Close dropdown
    }
  };

  const { setUploadingState } = useUploadingStateManagement();

  async function savePost() {
    try {
      if (image && place?.id) {
        setIsSaving(true);
        setUploadingState.mutate(true);
        uploadImageAsync(
          image,
          setUploadingState,
          place?.id,
          place.displayName.text,
          place.formattedAddress,
          selectedOccupancy
        ).then(() => {
          if (senderToken) {
            sendPushNotificationResponse(senderToken, place?.id);
          }
          navigation.navigate('Feed');
        });
        setUser({ lastUploadedPost: new Date().toISOString() });
      }
    } catch (errors) {
      console.error(errors);
    }
  }

  return (
    <Layout pageTitle={'Summary'} showBottomTabs={false}>
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={Icons.Left} size={24} color={'white'} />
            </TouchableOpacity>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                color: primaryColor,
                fontSize: 32,
                textAlign: 'center',
                marginBottom: 15,
              }}
            >
              {t('new-post')}
            </Text>

            <View
              style={
                isTablet
                  ? tabletStyles.contentContainer
                  : styles.contentContainer
              }
            >
              <View style={styles.textContainer}>
                <Text style={styles.label}>{t('location')}:</Text>
                <Text
                  style={styles.dynamicText}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {place?.formattedAddress ?? ''}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>{t('name')}</Text>
                <Text style={styles.dynamicText}>
                  {place?.displayName.text ?? ''}
                </Text>
              </View>

              <View style={[styles.textContainer, styles.dropdownContainer]}>
                <Text style={styles.label}>{t('occupancy')}:</Text>

                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={[
                      styles.dropdown,
                      { width: 150 }, // Fixed width
                    ]}
                  >
                    <Text style={styles.dropdownText}>
                      {occupancyLabels[selectedOccupancy]}
                    </Text>
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {Object.values(occupacyOptions).map(option => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => handleSelect(option)}
                          style={styles.dropdownItem}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedOccupancy === option
                                ? { color: primaryColor }
                                : { color: 'white' },
                            ]}
                          >
                            {occupancyLabels[option]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={{ height: width, marginTop: 15 }}>
                <FastImage
                  style={isTablet ? tabletStyles.photo : styles.photo}
                  source={{
                    priority: FastImage.priority.high,
                    uri: image ?? '',
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>

              <TouchableOpacity
                style={formStyles.buttonPrimary}
                onPress={savePost}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingIndicator />
                ) : (
                  <Text style={formStyles.buttonText}>{t('save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      </TouchableWithoutFeedback>
    </Layout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
  },
  textContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    color: iconInactiveColor,
    width: '30%',
  },
  dynamicText: {
    color: 'white',
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
  },
  photo: {
    borderRadius: 20,
    width: '100%',
    aspectRatio: 1,
    zIndex: 1,
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  dropdownWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 'auto',
    flex: 2,
  },
  dropdown: {
    padding: 10,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: primaryBgColor,
    justifyContent: 'center',
  },
  dropdownText: {
    color: 'white',
    textAlign: 'right',
  },
  dropdownList: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: primaryBgColor,
    borderRadius: 10,
    borderColor: 'white',
    borderWidth: 1,
    zIndex: 30,
    width: '100%',
  },
  dropdownItem: {
    padding: 10,
    borderBottomColor: 'white',
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    color: 'white',
    textAlign: 'right',
  },
});

const tabletStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 30,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    zIndex: 1,
  },
});

export default PostSummary;
