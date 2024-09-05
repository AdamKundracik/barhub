import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/user/Shared/Layout';
import { useQuery, useQueryClient } from 'react-query';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import {
  handleFreshContent,
  handlePlacePosts,
} from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import PlaceSearch from '../../components/user/Search/PlaceSearch';
import { PlaceDetailsResponse, PlacePrediction } from '../../utils/types/types';
import { Post } from '../../../../shared';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendPushNotification } from '../../utils/services/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';
import { useImageManagement } from '../../utils/hooks/useImageManagement';

export const NewsFeed: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { userData } = useUserContext();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [isPlaceLoaded, setIsPlaceLoaded] = useState(false); // Ensure place is loaded before fetching files
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const { deleteImage } = useImageManagement();

  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  useEffect(() => {
    const numberOfDays = getDaysSince(userData?.lastUploadedPost ?? new Date());
    setNumberOfDaysSinceLastPostedPhoto(numberOfDays);
  }, [userData]);

  const { data: imageUploading, refetch } = useQuery(
    'imageUploading',
    () => {},
    { refetchInterval: 5000 }
  );

  const handleScreenFocus = () => {
    const image = queryClient.getQueryData<string>('capturedImage');
    if (image) deleteImage.mutate();
  };

  useFocusEffect(handleScreenFocus);

  useEffect(() => {
    if (isPlaceLoaded) {
      getFiles();
    }
  }, [imageUploading, isPlaceLoaded]);

  const getFiles = async () => {
    setLoading(true);
    try {
      const data = place
        ? await handlePlacePosts(place.placeId)
        : await handleFreshContent();

      setPosts(data.posts);
      setLastVisible(data.lastVisible);
    } catch (error) {
      console.error('Error getting files:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (isPlaceLoaded) {
      getFiles();
    }
  }, [place, isPlaceLoaded]);

  const fetchMorePosts = async (lastVisible: string) => {
    if (!lastVisible) return;
    try {
      const data = place
        ? await handlePlacePosts(place.placeId, lastVisible)
        : await handleFreshContent(lastVisible);

      if (data.posts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...data.posts]);
        setLastVisible(data.lastVisible);
      } else {
      }
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };

  useEffect(() => {
    getFiles();
  }, [place]);

  async function requestPhoto() {
    const senderToken = userData?.pushToken;
    if (place) {
      const detail: PlaceDetailsResponse = await fetchPlaceDetails(
        place.placeId
      );
      const tokens = await sendNotificationHandler({
        latitude: detail.result.geometry.location?.lat,
        longitude: detail.result.geometry.location?.lng,
      });
      tokens.forEach(token => {
        sendPushNotification(token, place.placeId, senderToken ?? '');
      });
    }
  }

  if (searching)
    return <PlaceSearch setSearching={setSearching} setPlace={setPlace} />;

  return (
    <Layout pageTitle="Feed">
      <FeedHeader
        place={place}
        setSearching={setSearching}
        setPlace={setPlace}
      />
      <NotificationHandler navigation={navigation} userData={userData} />
      {loading ? (
        <LoadingIndicator />
      ) : posts.length ? (
        <PostsList
          posts={posts}
          zoomedPost={zoomedPost}
          setZoomedPost={setZoomedPost}
          userData={userData}
          numberOfDaysSinceLastPostedPhoto={numberOfDaysSinceLastPostedPhoto}
          place={place}
          requestPhoto={requestPhoto}
          fetchMorePosts={() => fetchMorePosts(lastVisible ?? '')}
          onRefresh={onRefresh}
          loading={loading}
        />
      ) : (
        <EmptyState requestPhoto={requestPhoto} />
      )}
    </Layout>
  );
};

export default NewsFeed;
