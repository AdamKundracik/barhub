import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Icons from '@fortawesome/free-solid-svg-icons';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import InteractionBar from '@/src/app/components/user/NewsFeed/Post/InteractionBar';
import { PostOptionsModal } from '@/src/app/components/shared/Modals/PostOptionsModal';
import { PostReportModal } from '@/src/app/components/shared/Modals/ReportPostModal';
import { usePostDetail } from '@/src/app/hooks/usePostDetail';
import { shareService } from '@/src/app/services/shareService';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { postService } from '@/src/app/services/postService';
import {
  ReasonTypeEnum,
  reportService,
} from '@/src/app/services/reportService';
import { useQueryClient } from 'react-query';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import {
  postBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Center } from '@/components/ui/center';
import InlineAd from '@/src/app/components/user/InlineAd';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import {
  addCacheBuster,
  createImageKey,
} from '@/src/app/utils/cache/imageCacheUtils';

export const PostDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const queryClient = useQueryClient();
  const { getUserId, isPremium } = useUserStore();

  // Check if we can go back (if there's a previous screen in the stack)
  const canGoBack = navigation.canGoBack();

  const { postId } = route.params as { postId: string };
  const { post, isLoading, error, refetch } = usePostDetail(postId);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Local like state for optimistic updates
  const [localLiked, setLocalLiked] = useState(post?.isLiked || false);
  const [localLikeCount, setLocalLikeCount] = useState(post?.likesCount || 0);

  // Local highlight state for optimistic updates
  const [localIsHighlighted, setLocalIsHighlighted] = useState(
    post?.isHighlighted || false
  );

  // Debounce timer for like requests to prevent spam
  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const backendLikedState = useRef(post?.isLiked || false);

  // Sync local state with post data when it changes
  useEffect(() => {
    if (post) {
      setLocalLiked(post.isLiked);
      setLocalLikeCount(post.likesCount);
      setLocalIsHighlighted(post.isHighlighted);
      backendLikedState.current = post.isLiked;

      // Clear any pending debounce timer when post changes
      if (likeDebounceTimer.current) {
        clearTimeout(likeDebounceTimer.current);
        likeDebounceTimer.current = null;
      }
    }
  }, [post?.isLiked, post?.likesCount, post?.isHighlighted, post?.id]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (likeDebounceTimer.current) {
        clearTimeout(likeDebounceTimer.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (!post) return;

    try {
      await shareService.sharePost(post);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!post) return;

    try {
      await shareService.copyPostLink(post.id);
      showSuccessToast(t('link-copied'), t('link-copied-desc'));
    } catch (error) {
      console.error('Error copying link:', error);
      showErrorToast(t('error'), t('something-went-wrong'));
    }
  };

  const handleNavigateToUser = () => {
    if (!post?.userId) return;
    (navigation as any).navigate('UserDetail', { userId: post.userId });
  };

  // Handle back navigation - go to Feed if no previous screen (deeplink scenario)
  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else {
      // Navigate to Feed if opened from deeplink
      (navigation as any).navigate('MainTabs', { screen: 'Feed' });
    }
  };

  const handleReport = async (reason: ReportReason, customReason?: string) => {
    if (!post) return;

    const userId = getUserId();
    if (!userId) {
      showErrorToast(t('error'), t('user-not-found'));
      return;
    }

    try {
      const backendReason = reason as unknown as ReasonTypeEnum;
      await reportService.createReport(
        parseInt(userId, 10),
        post.id,
        backendReason,
        customReason
      );

      showSuccessToast(
        t('reportPost.successTitle'),
        t('reportPost.successDescription')
      );
    } catch (error) {
      console.error('Error reporting post:', error);
      showErrorToast(
        t('reportPost.errorTitle'),
        t('reportPost.errorDescription')
      );
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing post:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync like state with backend (called after debounce)
  const syncLikeWithBackend = useCallback(
    async (currentUIState: boolean) => {
      if (!post) return;

      // Only call API if UI state differs from backend state
      if (currentUIState === backendLikedState.current) {
        return; // States match - no API call needed
      }

      const userId = getUserId();
      if (!userId) {
        showErrorToast(t('error'), t('user-not-found'));
        return;
      }

      try {
        // Call backend API to toggle
        const response = await postService.toggleLike(
          post.id,
          parseInt(userId, 10)
        );

        if (response) {
          // Update backend state tracker
          backendLikedState.current = response.liked;

          // Sync UI with actual backend response (source of truth)
          setLocalLiked(response.liked);
          setLocalLikeCount(response.totalLikes);

          // Invalidate 'posts' feed cache to trigger refetch when user navigates back
          await queryClient.invalidateQueries(['posts'], {
            refetchActive: true,
          });
        }
      } catch (error) {
        console.error('Error syncing like with backend:', error);
        // On error, revert to backend state
        setLocalLiked(backendLikedState.current);
        setLocalLikeCount(prev =>
          backendLikedState.current ? prev : Math.max(prev - 1, 0)
        );
        showErrorToast(t('error'), t('something-went-wrong'));
      }
    },
    [post, getUserId, t, queryClient, showErrorToast]
  );

  const handleLikeToggle = useCallback(() => {
    if (!post) return;

    // Immediate optimistic UI update
    const newLikedState = !localLiked;
    setLocalLiked(newLikedState);
    setLocalLikeCount(prev =>
      newLikedState ? prev + 1 : Math.max(prev - 1, 0)
    );

    // Clear existing debounce timer
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }

    // Debounce backend sync (800ms) - prevents spam clicking
    // After user stops clicking, sync final UI state with backend
    likeDebounceTimer.current = setTimeout(() => {
      syncLikeWithBackend(newLikedState);
    }, 800);
  }, [post, localLiked, syncLikeWithBackend]);

  const handleHighlight = async () => {
    if (!post) return;

    const userId = getUserId();
    if (!userId) {
      showErrorToast(t('error'), t('user-not-found'));
      return;
    }

    try {
      // Optimistic update
      setLocalIsHighlighted(!localIsHighlighted);

      // Call backend
      const result = await postService.toggleHighlight(
        post.id,
        parseInt(userId, 10),
        localIsHighlighted
      );

      if (result.success) {
        setLocalIsHighlighted(result.isHighlighted);

        // Update ALL posts caches - catches main feed and all placeId filters
        queryClient.setQueriesData(['posts'], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page || !Array.isArray(page.posts)) return page;

              return {
                ...page,
                posts: page.posts.map((p: any) =>
                  p.id === post.id
                    ? { ...p, isHighlighted: result.isHighlighted }
                    : p
                ),
              };
            }),
            pageParams: oldData.pageParams || [],
          };
        });

        // Update userHighlights cache (for profile grid)
        queryClient.invalidateQueries(['userHighlights']);

        // Show success toast
        showSuccessToast(
          result.isHighlighted
            ? t('highlight-success')
            : t('unhighlight-success'),
          ''
        );
      } else {
        // Revert optimistic update on failure
        setLocalIsHighlighted(localIsHighlighted);
        showErrorToast(
          t('highlight-error'),
          result.message || t('something-went-wrong')
        );
      }
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      // Revert optimistic update
      setLocalIsHighlighted(localIsHighlighted);

      // Show user-friendly error
      const errorMessage = error?.message || t('something-went-wrong');
      if (errorMessage.includes('limit')) {
        showErrorToast(t('highlight-limit-reached'), '');
      } else {
        showErrorToast(t('highlight-error'), errorMessage);
      }
    } finally {
      setIsOptionsModalOpen(false);
    }
  };

  const confirmDelete = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(
        t('deletePost.confirmTitle'),
        t('deletePost.confirmMessage'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('submit'), style: 'destructive', onPress: onConfirm },
        ],
        { cancelable: true }
      );
    },
    [t]
  );

  const handleDelete = useCallback(async () => {
    if (!post) return;

    confirmDelete(async () => {
      try {
        const result: { success: boolean; message?: string } =
          await postService.deletePost(post.id);
        if (!result.success) {
          throw new Error(result.message || 'Failed to delete post');
        }

        // Invalidate all related queries after delete
        queryClient.invalidateQueries(['posts']); // Refresh main feed
        queryClient.invalidateQueries(['userHighlights']); // Refresh highlights (in case deleted post was highlighted)

        showSuccessToast(
          t('deletePost.successTitle'),
          t('deletePost.successDescription')
        );

        // Navigate back after successful delete
        setIsOptionsModalOpen(false);
        handleBackPress();
      } catch (error: any) {
        console.error('Failed to delete post:', error);
        showErrorToast(t('errors.failedToDeletePost'), error.message);
        setIsOptionsModalOpen(false);
      }
    });
  }, [post, confirmDelete, queryClient, showSuccessToast, showErrorToast, t, handleBackPress]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesomeIcon
          icon={Icons.faExclamationCircle}
          size={64}
          color={secondaryTextColor}
        />
        <Text style={styles.errorText}>{t('post-not-found')}</Text>

        <HStack space="md" style={{ marginTop: 24 }}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackPress}
          >
            <FontAwesomeIcon icon={Icons.faArrowLeft} size={16} color="#fff" />
            <Text style={styles.secondaryButtonText}>{t('go-back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <FontAwesomeIcon
                icon={Icons.faRotateBack}
                size={16}
                color="#000"
              />
            )}
            <Text style={styles.backButtonText}>
              {isRefreshing ? t('loading') : t('retry')}
            </Text>
          </TouchableOpacity>
        </HStack>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
        style={styles.header}
      >
        <HStack style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBackPress}
          >
            <FontAwesomeIcon icon={Icons.faArrowLeft} size={24} color="#fff" />
          </TouchableOpacity>

          <HStack space="md">
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsOptionsModalOpen(true)}
            >
              <FontAwesomeIcon
                icon={Icons.faEllipsisV}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </HStack>
        </HStack>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* Post Image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsImageZoomed(!isImageZoomed)}
        >
          <FastImage
            source={{ uri: post.photoUrl }}
            style={styles.postImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        </TouchableOpacity>

        {/* Post Content */}
        <View style={styles.contentContainer}>
          {/* User Info - Only name and time */}
          <View style={styles.userSection}>
            <HStack space="md" style={styles.userInfo}>
              <TouchableOpacity onPress={handleNavigateToUser}>
                <Avatar size="md" style={styles.avatarContainer}>
                  {post.user?.photoUrl ? (
                    <AvatarImage
                      key={createImageKey('postdetail', post.user.id, post.user.photoUrl)}
                      source={{
                        uri: addCacheBuster(post.user.photoUrl, post.user.id),
                      }}
                      style={styles.avatar}
                    />
                  ) : (
                    <AvatarFallbackText className={'text-white'}>
                      {post.user?.displayName || 'User'}
                    </AvatarFallbackText>
                  )}
                </Avatar>
              </TouchableOpacity>

              <VStack style={{ flex: 1 }}>
                <HStack space="sm" style={{ alignItems: 'center' }}>
                  <TouchableOpacity onPress={handleNavigateToUser}>
                    <Text style={styles.userName}>
                      {post.user?.displayName}
                    </Text>
                  </TouchableOpacity>
                  {localIsHighlighted && (
                    <View style={styles.highlightBadge}>
                      <FontAwesomeIcon
                        icon={Icons.faStar}
                        size={12}
                        color="#FFC107"
                      />
                      <Text style={styles.highlightText}>
                        {t('highlighted')}
                      </Text>
                    </View>
                  )}
                </HStack>
                <Text style={styles.postTime}>
                  {new Date(post.creationTime).toLocaleString('sk-SK', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </VStack>
            </HStack>
          </View>

          {/* Interaction Bar */}
          <InteractionBar
            isLiked={localLiked}
            likes={localLikeCount}
            comments={post.commentsCount}
            occupancy={post.occupancy}
            onLikeToggle={handleLikeToggle}
            onCommentToggle={() => {
              // TODO: Open comments
            }}
          />

          {/* Place Info Card */}
          <View style={styles.placeCard}>
            <HStack space="md" style={styles.placeHeader}>
              <FontAwesomeIcon
                icon={Icons.faMapMarkerAlt}
                size={20}
                color={primaryColor}
              />
              <Text style={styles.placeName} numberOfLines={2}>
                {post.placeName}
              </Text>
            </HStack>

            <Text style={styles.placeAddress} numberOfLines={3}>
              {post.placeAddress}
            </Text>
          </View>

          {/* Inline Ad */}
          {(PremiumHelpers.shouldAlwaysShowAds() || !isPremium()) && (
            <View style={styles.adContainer}>
              <InlineAd />
            </View>
          )}

          {/* Quick Actions Bar */}
          <HStack style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleShare}
            >
              <FontAwesomeIcon
                icon={Icons.faShareNodes}
                size={20}
                color={primaryColor}
              />
              <Text style={styles.quickActionText}>{t('share')}</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleCopyLink}
            >
              <FontAwesomeIcon
                icon={Icons.faLink}
                size={20}
                color={primaryColor}
              />
              <Text style={styles.quickActionText}>{t('copy-link')}</Text>
            </TouchableOpacity>
          </HStack>

          {/* Comments Section - Placeholder */}
          <View style={styles.commentsSection}>
            <HStack style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('comments')}</Text>
              <Text style={styles.commentCount}>{post.commentsCount || 0}</Text>
            </HStack>
            <Center style={styles.commentsPlaceholder}>
              <FontAwesomeIcon
                icon={Icons.faComments}
                size={32}
                color={secondaryTextColor}
              />
              <Text style={styles.placeholderText}>
                {t('comments-coming-soon')}
              </Text>
            </Center>
          </View>
        </View>
      </ScrollView>

      {/* Post Options Modal */}
      {post && (
        <PostOptionsModal
          visible={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          showDelete={post.canDelete}
          showReport={post.canReport}
          showHighlight={post.canHighlight}
          isHighlighted={localIsHighlighted}
          onDelete={handleDelete}
          onReport={() => {
            setIsOptionsModalOpen(false);
            setIsReportModalOpen(true);
          }}
          onHighlight={handleHighlight}
          onShare={handleShare}
        />
      )}

      {/* Report Modal */}
      {post && (
        <PostReportModal
          visible={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSave={handleReport}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: primaryTextColor,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  postImage: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#111',
  },
  contentContainer: {
    backgroundColor: postBgColor,
    paddingBottom: 40,
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    borderWidth: 0,
  },
  avatarFallback: {
    backgroundColor: 'transparent',
    color: 'white',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: primaryTextColor,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    gap: 4,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFC107',
  },
  postTime: {
    fontSize: 13,
    color: secondaryTextColor,
    marginTop: 2,
  },
  placeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  placeHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: primaryTextColor,
    flex: 1,
  },
  placeAddress: {
    fontSize: 14,
    color: secondaryTextColor,
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: 32,
  },
  adContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 15,
    color: primaryTextColor,
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  commentsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryTextColor,
  },
  commentCount: {
    fontSize: 14,
    fontWeight: '600',
    color: secondaryTextColor,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentsPlaceholder: {
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: secondaryTextColor,
    marginTop: 12,
  },
});

export default PostDetail;
