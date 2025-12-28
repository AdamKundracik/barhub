import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PostsList from '../../../components/user/NewsFeed/PostList';
import PostLoaderView from '../../../components/user/NewsFeed/Post/Loaders/PostLoaderView';
import EmptyState from '../../../components/user/NewsFeed/EmptyState';
import LocationRequiredState from '../../../components/user/NewsFeed/LocationRequiredState';
import { primaryColor } from '../../../utils/styles/colors';
import { checkGeolocationPermission } from '../../../utils/services/permission.service';

interface FeedContentProps {
  isLoading: boolean;
  posts: any[];
  isRefetching: boolean;
  onRefresh: () => Promise<void>;
  onForceRefresh?: () => Promise<void>;
  // Post list props
  hasNextPage?: boolean;
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: any;
  requestPhoto: () => Promise<void>;
  onCommentPress: (postId: string, token: string, userId: string) => void;
  isFiltering: boolean;
  isFetchingNextPage: boolean;
  fetchMorePosts: () => Promise<void>;
}

export const FeedContent: React.FC<FeedContentProps> = ({
  isLoading,
  posts,
  isRefetching,
  onRefresh,
  onForceRefresh,
  hasNextPage,
  zoomedPost,
  setZoomedPost,
  userData,
  requestPhoto,
  onCommentPress,
  isFiltering,
  isFetchingNextPage,
  fetchMorePosts,
}) => {
  const [hasGeolocationPermission, setHasGeolocationPermission] = useState<
    boolean | null
  >(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastPermissionCheckRef = useRef<number>(0);

  // Permission check function
  const checkPermission = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();

    // Prevent rapid successive permission checks
    if (!forceRefresh && now - lastPermissionCheckRef.current < 3000) {
      console.log('[FeedContent] Permission check too recent, skipping');
      return;
    }

    try {
      console.log(
        '[FeedContent] Checking geolocation permission (forceRefresh:',
        forceRefresh,
        ')'
      );
      const granted = await checkGeolocationPermission(forceRefresh);
      console.log('[FeedContent] Permission check result:', granted);
      setHasGeolocationPermission(granted);
      lastPermissionCheckRef.current = Date.now();
    } catch (error) {
      console.error('[FeedContent] Permission check failed:', error);
      setHasGeolocationPermission(false);
      lastPermissionCheckRef.current = Date.now();
    }
  }, []);

  // Initial permission check on mount
  useEffect(() => {
    console.log('[FeedContent] Initial permission check on mount');
    checkPermission(false);
  }, [checkPermission]);

  // Android: Use React Navigation focus event (prevents infinite loop)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        console.log(
          '[FeedContent] Android screen focused, checking permission'
        );
        // Small delay to ensure screen is fully focused
        const timeout = setTimeout(() => {
          checkPermission(true);
        }, 500);

        return () => {
          clearTimeout(timeout);
        };
      }
    }, [checkPermission])
  );

  // iOS: Use AppState "change" event (works correctly on iOS)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        const prevAppState = appStateRef.current;

        console.log(
          '[FeedContent] iOS AppState change:',
          prevAppState,
          '->',
          nextAppState
        );

        // When app becomes active, check geolocation permission
        if (prevAppState !== 'active' && nextAppState === 'active') {
          console.log(
            '[FeedContent] iOS app became active, checking permission'
          );
          checkPermission(true);
        }

        appStateRef.current = nextAppState;
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );

      return () => {
        subscription.remove();
      };
    }
  }, [checkPermission]);

  // Debug logging
  console.log('[FeedContent] Render state:', {
    isLoading,
    hasGeolocationPermission,
    postsCount: posts?.length || 0,
  });

  if (isLoading || hasGeolocationPermission === null) {
    console.log(
      '[FeedContent] Showing PostLoaderView - loading or permission check pending'
    );
    return <PostLoaderView />;
  }

  // If no location permission, show location required state
  if (!hasGeolocationPermission) {
    console.log(
      '[FeedContent] ✅ Showing LocationRequiredState - no geolocation permission'
    );
    return (
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <LocationRequiredState requestPhoto={requestPhoto} />
      </ScrollView>
    );
  }

  // // If no location permission, show location required state
  // if (!hasGeolocationPermission) {
  //   console.log('[FeedContent] Showing LocationRequiredState');
  //   return (
  //     <ScrollView
  //       contentContainerStyle={styles.scrollViewContent}
  //       showsVerticalScrollIndicator={false}
  //       refreshControl={
  //         <RefreshControl
  //           refreshing={isRefetching}
  //           onRefresh={onRefresh}
  //           tintColor={primaryColor}
  //           colors={[primaryColor]}
  //         />
  //       }
  //     >
  //       <LocationRequiredState requestPhoto={requestPhoto} />
  //     </ScrollView>
  //   );
  // }

  // If we have location permission and posts, show the list
  if (posts?.length > 0) {
    console.log('[FeedContent] Showing PostsList');
    return (
      <PostsList
        hasMorePosts={hasNextPage}
        posts={posts}
        zoomedPost={zoomedPost}
        setZoomedPost={setZoomedPost}
        userData={userData}
        requestPhoto={requestPhoto}
        onCommentPress={onCommentPress}
        isFiltering={isFiltering}
        onRefresh={onRefresh}
        onForceRefresh={onForceRefresh}
        loading={isRefetching}
        isFetchingNextPage={isFetchingNextPage}
        fetchMorePosts={fetchMorePosts}
      />
    );
  }

  // If we have location permission but no posts, show empty state
  console.log('[FeedContent] Showing EmptyState');
  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={primaryColor}
          colors={[primaryColor]}
        />
      }
    >
      <EmptyState requestPhoto={requestPhoto} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAdContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
});
