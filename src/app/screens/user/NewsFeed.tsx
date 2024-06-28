import Layout from '../../components/user/Layout';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import UserPost from '../../components/user/UserPost';
import ActionsRow from '../../components/user/ActionsRow';
import { useImageManagement } from '../../utils/hooks/useImageManagement';
import { useQuery, useQueryClient } from 'react-query';
import { useFocusEffect } from '@react-navigation/native';
import { commonAppStyles } from '../../utils/styles/styles';
import { listFiles } from '../../utils/helper-functions/helperFunctions';
import PlaceSearch from '../../components/user/PlaceSearch';
import { PlacePrediction } from '../../utils/types/types';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlaceFilterChip from '../../components/user/PlaceFilterChip';

export const NewsFeed = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const { data: imageUploading, refetch } = useQuery(
    'imageUploading',
    () => {},
    {
      refetchInterval: 5000,
    }
  );

  const { deleteImage } = useImageManagement();

  const handleScreenFocus = () => {
    const image = queryClient.getQueryData<string>('capturedImage');
    if (image) deleteImage.mutate();
  };

  useFocusEffect(handleScreenFocus);

  async function savePlaceToStorage(place: PlacePrediction) {
    try {
      await AsyncStorage.setItem('savedPlace', JSON.stringify(place));
    } catch (error) {
      console.error('Error saving place to storage:', error);
    }
  }

  async function getPlaceFromStorage() {
    try {
      const savedPlace = await AsyncStorage.getItem('savedPlace');
      if (savedPlace) {
        setPlace(JSON.parse(savedPlace));
      }
    } catch (error) {
      console.error('Error getting place from storage:', error);
    }
  }

  const getFiles = async () => {
    setLoading(true);
    try {
      const urls = await listFiles(place?.placeId);
      if (urls) {
        setFileUrls(urls);
      } else {
        setFileUrls([]);
      }
    } catch (error) {
      console.error('Error getting files:', error);
      setFileUrls([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    getFiles();
  }, [place]);

  useEffect(() => {
    getPlaceFromStorage();
  }, []);

  useEffect(() => {
    getFiles();
    if (place) {
      savePlaceToStorage(place);
    }
  }, [place]);

  if (searching)
    return <PlaceSearch setSearching={setSearching} setPlace={setPlace} />;

  return (
    <Layout pageTitle="Feed">
      <ActionsRow setSearching={setSearching} />
      {place && (
        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
          <PlaceFilterChip
            setPlace={setPlace}
            place={place.structuredFormat.mainText.text}
          />
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          <View>
            {imageUploading ? (
              <View>
                <Text style={commonAppStyles.textPrimary}>
                  Uploading photo...
                </Text>
              </View>
            ) : null}
            {fileUrls.length ? (
              fileUrls.map(url => (
                <View
                  key={url}
                  style={{
                    marginVertical: 10,
                    zIndex: zoomedPost === url ? 1 : 0,
                  }}
                >
                  <UserPost
                    link={url}
                    setZoomedPost={setZoomedPost}
                    isZoomed={zoomedPost === url}
                  />
                </View>
              ))
            ) : (
              <View style={styles.infoContainer}>
                <View style={{ marginBottom: 15, justifyContent: 'center' }}>
                  <Text style={[commonAppStyles.textPrimary, { fontSize: 22 }]}>
                    {t('photos-info')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.requestButton}>
                  <Text
                    style={[
                      commonAppStyles.textSecondary,
                      { fontSize: 22, fontWeight: 'bold' },
                    ]}
                  >
                    {t('request-photo')}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: '#a6a6a6' }}>
                  {t('request-photo-info')}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionsRow: {
    height: 30,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  scrollView: {
    flexGrow: 1,
  },
  infoContainer: {
    marginTop: 50,
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    width: 300,
  },
  requestButton: {
    borderRadius: 10,
    backgroundColor: '#d8d8d8',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
});

export default NewsFeed;
