import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/user/Shared/Layout';
import { useQuery } from 'react-query';
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import {
  handleFreshContent,
  handlePlacePosts,
} from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
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
import CommentsSlider from '../../components/user/NewsFeed/Post/CommentsSlider';

export const NewsFeed: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { userData } = useUserContext();
  const route = useRoute();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const routeParams = route.params as { selectedPlace?: PlacePrediction }; // Define route params
  const [postId, setPostId] = useState<string | null>(null);
  const { users } = useUserContext();

  useEffect(() => {
    if (routeParams?.selectedPlace) {
      setPlace(routeParams.selectedPlace); // Set the place when passed from PlaceSearch
    }
  }, [routeParams?.selectedPlace]);

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

  useEffect(() => {
    getFiles();
  }, [imageUploading, refetch]);

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
    getFiles();
  }, [place]);

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

  async function toggleComments(postId: string) {
    setPostId(postId);
    setShowComments(true);
  }

  return (
    <Layout pageTitle="Feed">
      <FeedHeader place={place} setPlace={setPlace} />
      <NotificationHandler navigation={navigation} userData={userData} />
      {loading ? (
        <LoadingIndicator />
      ) : posts.length ? (
        <PostsList
          onCommentPress={postId => toggleComments(postId)}
          isFiltering={!!place}
          posts={posts}
          zoomedPost={zoomedPost}
          setZoomedPost={setZoomedPost}
          userData={userData}
          place={place}
          numberOfDaysSinceLastPostedPhoto={numberOfDaysSinceLastPostedPhoto}
          requestPhoto={requestPhoto}
          fetchMorePosts={() => fetchMorePosts(lastVisible ?? '')}
          onRefresh={onRefresh}
          loading={loading}
        />
      ) : (
        <EmptyState place={place} requestPhoto={requestPhoto} />
      )}
      {showComments && (
        <CommentsSlider
          users={users}
          postId={postId}
          closeComments={() => setShowComments(false)}
        />
      )}
    </Layout>
  );
};

export default NewsFeed;
