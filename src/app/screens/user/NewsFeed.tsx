import Layout from '../../components/user/Layout';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

export const NewsFeed = () => {
  const queryClient = useQueryClient();
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

  const getFiles = () => {
    setLoading(true);
    listFiles(place?.placeId).then(urls => {
      if (urls) setFileUrls(urls);
      setLoading(false);
    });
  };

  const onRefresh = React.useCallback(() => {
    setLoading(true);
    getFiles();
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    getFiles();
    console.log('place', place);
  }, [place]);

  if (searching)
    return <PlaceSearch setSearching={setSearching} setPlace={setPlace} />;

  return (
    <Layout pageTitle="Feed">
      <ActionsRow setSearching={setSearching} />
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
                  {/*docasne*/}
                  Uploading photo...
                </Text>
              </View>
            ) : null}

            {fileUrls.map(url => (
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
            ))}
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
});

export default NewsFeed;
