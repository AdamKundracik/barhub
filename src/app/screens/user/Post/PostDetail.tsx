import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export const PostDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const queryClient = useQueryClient();
  const { getUserId } = useUserStore();

  const { postId } = route.params as { postId: string };
  const { post, isLoading, error } = usePostDetail(postId);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Local like state for optimistic updates
  const [localLiked, setLocalLiked] = useState(post?.isLiked || false);
  const [localLikeCount, setLocalLikeCount] = useState(post?.likesCount || 0);

  // Sync local state with post data when it changes
  useEffect(() => {
    if (post) {
      setLocalLiked(post.isLiked);
      setLocalLikeCount(post.likesCount);
    }
  }, [post?.isLiked, post?.likesCount]);

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

  const handleLikeToggle = async () => {
    if (!post) return;

    const userId = getUserId();
    if (!userId) {
      showErrorToast(t('error'), t('user-not-found'));
      return;
    }

    try {
      // Optimistic update
      const newLikedState = !localLiked;
      setLocalLiked(newLikedState);
      setLocalLikeCount(prev =>
        newLikedState ? prev + 1 : Math.max(prev - 1, 0)
      );

      // Call backend API
      const response = await postService.toggleLike(
        post.id,
        parseInt(userId, 10)
      );

      if (response) {
        // Update local state with backend response
        setLocalLiked(response.liked);
        setLocalLikeCount(response.totalLikes);

        // Update local 'post' detail cache
        queryClient.setQueryData(['post', post.id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isLiked: response.liked,
            likesCount: response.totalLikes,
          };
        });

        // Invalidate 'posts' feed cache to trigger refetch when user navigates back
        // refetchActive: false means it won't refetch now, only when query becomes active again
        await queryClient.invalidateQueries(['posts'], {
          refetchActive: true,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setLocalLiked(!localLiked);
      setLocalLikeCount(prev => (localLiked ? prev - 1 : prev + 1));
      showErrorToast(t('error'), t('something-went-wrong'));
    }
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('go-back')}</Text>
        </TouchableOpacity>
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
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={Icons.faArrowLeft} size={24} color="#fff" />
          </TouchableOpacity>

          <HStack space="md">
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <FontAwesomeIcon
                icon={Icons.faShareNodes}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

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

      <ScrollView style={styles.scrollView}>
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
              <TouchableOpacity>
                {post.user?.photoUrl ? (
                  <FastImage
                    source={{ uri: post.user.photoUrl }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {post.user?.displayName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <VStack style={{ flex: 1 }}>
                <Text style={styles.userName}>{post.user?.displayName}</Text>
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
          onDelete={() => {
            // TODO: Implement delete
            console.log('Delete post:', post.id);
          }}
          onReport={() => {
            setIsOptionsModalOpen(false);
            setIsReportModalOpen(true);
          }}
          onHighlight={() => {
            // TODO: Implement highlight
            console.log('Highlight post:', post.id);
          }}
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
  },
  backButtonText: {
    color: '#000',
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
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: primaryColor,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: primaryTextColor,
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
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
