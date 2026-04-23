import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  bottomModalBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';
import {
  CommentErrorCode,
  ErrorResponse,
  PostComment,
} from '@/src/app/types/commentTypes';
import commentService from '@/src/app/utils/services/comment.service';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useUserRole } from '@/src/app/hooks/useUserRole';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { ReportCommentModal } from '@/src/app/components/shared/Modals/ReportCommentModal';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { ReasonTypeEnum } from '@/src/app/types/dto';
import { reportService } from '@/src/app/services/reportService';
import {
  addCacheBuster,
  createImageKey,
} from '@/src/app/utils/cache/imageCacheUtils';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { getLocales } from 'expo-localization';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
const useKeyboardHeight = () => {
  const height = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: e => {
        'worklet';
        height.value = Math.max(e.height, 0);
      },
      onEnd: e => {
        'worklet';
        height.value = Math.max(e.height, 0);
      },
    },
    []
  );

  return height;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PostCommentsModalProps = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  commentsCount?: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
};

type CommentInputFooterProps = {
  userData: any;
  currentUserId: string;
  handleComment: (comment: string) => Promise<boolean>;
  isPosting: boolean;
  t: (key: string, options?: any) => string;
  keyboardHeight: Animated.SharedValue<number>;
  bottomInset: number;
};

// ---------------------------------------------------------------------------
// CommentInputFooter
// ---------------------------------------------------------------------------
const CommentInputFooter: React.FC<CommentInputFooterProps> = ({
  userData,
  currentUserId,
  handleComment,
  isPosting,
  t,
  keyboardHeight,
  bottomInset,
}) => {
  const [comment, setComment] = useState('');

  const animatedFooterStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return { paddingBottom: bottomInset };
    }
    return {
      paddingBottom:
        keyboardHeight.value > 0 ? keyboardHeight.value : bottomInset,
    };
  });

  const handleSubmit = useCallback(async () => {
    if (!comment.trim() || isPosting) return;
    const success = await handleComment(comment);
    if (success) {
      setComment('');
      Keyboard.dismiss();
    }
  }, [comment, isPosting, handleComment]);

  return (
    <Animated.View style={[styles.footerWrapper, animatedFooterStyle]}>
      <View style={styles.footerContainer}>
        <Avatar size="sm" style={styles.inputAvatar}>
          {userData?.photoUrl ? (
            <AvatarImage
              key={createImageKey(
                'comment-input',
                currentUserId,
                userData.photoUrl
              )}
              source={{ uri: addCacheBuster(userData.photoUrl, currentUserId) }}
            />
          ) : (
            <AvatarFallbackText className="text-white">
              {userData?.name || 'U'}
            </AvatarFallbackText>
          )}
        </Avatar>
        <BottomSheetTextInput
          style={styles.input}
          placeholder={t('add-comment') || 'Add a comment...'}
          placeholderTextColor={secondaryTextColor}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={80}
          editable={!isPosting}
          blurOnSubmit={false}
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!comment.trim() || isPosting}
          style={[
            styles.sendButton,
            (!comment.trim() || isPosting) && styles.sendButtonDisabled,
          ]}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <FontAwesomeIcon icon={Icons.Right} size={14} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// PostCommentsModal
// ---------------------------------------------------------------------------
export const PostCommentsModal = ({
  visible,
  onClose,
  postId,
  commentsCount = 0,
  onCommentAdded,
  onCommentDeleted,
}: PostCommentsModalProps) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { showErrorToast, showSuccessToast } = useCustomToast();
  const { hasAdminAccess } = useUserRole();
  const { getUserId, userData } = useUserStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const commentsListRef = useRef<any>(null);
  const locales = getLocales();
  const insets = useSafeAreaInsets();

  const keyboardHeight = useKeyboardHeight();

  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const STARTING_INDEX = 0;

  // Track previous stable index to snap back after keyboard closes.
  const lastStableIndex = useRef(STARTING_INDEX);
  const isKeyboardOpenRef = useRef(false);

  // FIX: Create pure JS functions to handle the refs, avoiding freezing inside worklets
  const handleKeyboardOpenJS = useCallback(() => {
    isKeyboardOpenRef.current = true;
  }, []);

  const handleKeyboardCloseJS = useCallback(() => {
    isKeyboardOpenRef.current = false;
    if (visible && bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(lastStableIndex.current);
    }
  }, [visible]);

  useAnimatedReaction(
    () => keyboardHeight.value,
    (current, previous) => {
      const wasOpen = (previous ?? 0) > 0;
      const isClosedNow = current === 0;

      if (current > 0) {
        runOnJS(handleKeyboardOpenJS)();
      }

      if (wasOpen && isClosedNow) {
        runOnJS(handleKeyboardCloseJS)();
      }
    },
    // Adding dependencies here to ensure reaction uses latest functions
    [handleKeyboardOpenJS, handleKeyboardCloseJS]
  );

  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [commentToReport, setCommentToReport] = useState<PostComment | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentUserId = getUserId();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = useCallback(
    (date: Date | string | undefined): string => {
      if (!date) return '';
      try {
        let dateObj: Date;
        if (typeof date === 'string') {
          let dateStr = date.includes('T') ? date : date.replace(' ', 'T');
          if (
            !dateStr.endsWith('Z') &&
            !dateStr.includes('+') &&
            !dateStr.includes('-', 10)
          ) {
            dateStr += 'Z';
          }
          dateObj = new Date(dateStr);
        } else {
          dateObj = date;
        }

        if (isNaN(dateObj.getTime())) return '';

        const diffInSeconds = Math.floor(
          (currentTime.getTime() - dateObj.getTime()) / 1000
        );
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays < 1) {
          if (diffInMinutes < 1) return t('just-now') || 'just now';
          if (diffInMinutes < 60) {
            if (['es', 'sk', 'de'].includes(i18n.language))
              return `${t('ago')} ${diffInMinutes} min`;
            return `${diffInMinutes} min ${t('ago')}`;
          }
          if (['es', 'sk', 'de'].includes(i18n.language))
            return `${t('ago')} ${diffInHours}h`;
          return `${diffInHours}h ${t('ago')}`;
        }

        const userLocale = locales[0]?.languageTag || 'en-US';
        return dateObj.toLocaleDateString(userLocale, {
          month: 'short',
          day: 'numeric',
          ...(diffInDays < 365 && { hour: '2-digit', minute: '2-digit' }),
        });
      } catch {
        return '';
      }
    },
    [currentTime, t, i18n.language, locales]
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const fetchedComments = await commentService.getCommentsForPost(
        postId,
        0,
        100
      );
      setComments(fetchedComments.reverse());
    } catch (error: any) {
      console.error('Error loading comments:', error);
      showErrorToast(
        t('error') || 'Error',
        t('failed-to-load-comments') || 'Failed to load comments'
      );
    } finally {
      setIsLoading(false);
    }
  }, [postId, t, showErrorToast]);

  const handleAddComment = useCallback(
    async (commentText: string): Promise<boolean> => {
      if (!commentText.trim() || !postId || !currentUserId || isPosting)
        return false;

      const trimmedComment = commentText.trim();
      setIsPosting(true);

      try {
        const addedComment = await commentService.addCommentToPost(
          postId,
          currentUserId,
          trimmedComment
        );

        setComments(prev => [addedComment, ...prev]);

        setTimeout(() => {
          commentsListRef.current?.scrollToIndex({ index: 0, animated: true });
        }, 100);

        onCommentAdded?.();
        return true;
      } catch (error: any) {
        console.error('Error adding comment:', error);

        const status = error?.response?.status;
        const errorData: ErrorResponse = error?.response?.data || {};
        const errorCode = errorData.errorCode;
        const errorMessage = errorData.message || error?.message || '';

        if (status === 409 && errorCode === CommentErrorCode.COMMENT_TOO_SOON) {
          const remainingSeconds = errorData.remainingSeconds || 30;
          showErrorToast(
            t('error') || 'Error',
            t('comment-spam-delay-with-time', { seconds: remainingSeconds }) ||
              `Please wait ${remainingSeconds} seconds before commenting again`
          );
        } else {
          showErrorToast(
            t('error') || 'Error',
            errorMessage ||
              t('failed-to-add-comment') ||
              'Failed to add comment'
          );
        }
        return false;
      } finally {
        setIsPosting(false);
      }
    },
    [postId, currentUserId, isPosting, onCommentAdded, t, showErrorToast]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!commentId || isDeleting === commentId) return;

      Alert.alert(
        t('delete-comment') || 'Delete Comment',
        t('delete-comment-confirm') ||
          'Are you sure you want to delete this comment?',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('delete') || 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(commentId);
              try {
                await commentService.deleteComment(commentId);
                setComments(prev => prev.filter(c => c.id !== commentId));
                onCommentDeleted?.();
                showSuccessToast(
                  t('success') || 'Success',
                  t('comment-deleted') || 'Comment deleted'
                );
              } catch (error: any) {
                showErrorToast(
                  t('error') || 'Error',
                  error?.response?.data?.message ||
                    t('failed-to-delete-comment') ||
                    'Failed to delete comment'
                );
              } finally {
                setIsDeleting(null);
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [isDeleting, onCommentDeleted, t, showErrorToast, showSuccessToast]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleReportComment = useCallback(
    async (reason: ReportReason, customReason?: string) => {
      if (!commentToReport) return;
      try {
        const reasonTypeEnum = reason as unknown as ReasonTypeEnum;
        await reportService.reportComment(
          commentToReport.id,
          reasonTypeEnum,
          customReason
        );
        showSuccessToast(
          t('success') || 'Success',
          t('comment-reported') || 'Comment reported successfully'
        );
        setReportModalVisible(false);
        setCommentToReport(null);
      } catch (error: any) {
        const status = error?.response?.status;
        const errorData: ErrorResponse = error?.response?.data || {};
        const errorCode = errorData.errorCode;
        const errorMessage = errorData.message || error?.message || '';

        if (
          status === 409 &&
          errorCode === CommentErrorCode.COMMENT_ALREADY_REPORTED
        ) {
          showErrorToast(
            t('error') || 'Error',
            t('comment-already-reported') ||
              errorMessage ||
              'You have already reported this comment'
          );
        } else {
          showErrorToast(
            t('error') || 'Error',
            errorMessage ||
              t('failed-to-report-comment') ||
              'Failed to report comment'
          );
        }
      }
    },
    [commentToReport, t, showSuccessToast, showErrorToast]
  );

  const openReportModal = useCallback((comment: PostComment) => {
    setCommentToReport(comment);
    setReportModalVisible(true);
  }, []);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (!currentUserId) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <CommentInputFooter
            userData={userData}
            currentUserId={currentUserId}
            handleComment={handleAddComment}
            isPosting={isPosting}
            t={t}
            keyboardHeight={keyboardHeight}
            bottomInset={insets.bottom}
          />
        </BottomSheetFooter>
      );
    },
    [
      currentUserId,
      userData,
      insets.bottom,
      t,
      handleAddComment,
      isPosting,
      keyboardHeight,
    ]
  );

  const renderCommentItem = useCallback(
    ({ item }: { item: PostComment }) => {
      const canDelete = item.canDelete || hasAdminAccess;
      const canReport = item.canReport;
      const isDeletingThis = isDeleting === item.id;

      let timeAgo = '';
      if (item.createdAt) timeAgo = formatTimeAgo(item.createdAt);
      else if (item.creationTime) timeAgo = formatTimeAgo(item.creationTime);

      const commentUserId = item.user?.id || item.userId;
      const handleUserPress = () => {
        if (commentUserId) {
          Keyboard.dismiss();
          bottomSheetRef.current?.dismiss();
          navigation.navigate('UserDetail', { userId: commentUserId });
        }
      };

      return (
        <View style={styles.commentItem}>
          <TouchableOpacity
            onPress={handleUserPress}
            disabled={!commentUserId}
            activeOpacity={0.7}
          >
            <Avatar size="md" style={styles.avatar}>
              {item.user?.photoUrl || item.userPhotoUrl ? (
                <AvatarImage
                  key={createImageKey(
                    'comment',
                    item.user?.id || item.userId || '',
                    item.user?.photoUrl || item.userPhotoUrl || ''
                  )}
                  source={{
                    uri: addCacheBuster(
                      item.user?.photoUrl || item.userPhotoUrl || '',
                      item.user?.id || item.userId || undefined
                    ),
                  }}
                />
              ) : (
                <AvatarFallbackText className="text-white">
                  {item.user?.name || item.userName || 'U'}
                </AvatarFallbackText>
              )}
            </Avatar>
          </TouchableOpacity>

          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <TouchableOpacity
                onPress={handleUserPress}
                disabled={!commentUserId}
                activeOpacity={0.7}
              >
                <Text style={styles.commentAuthor}>
                  {item.user?.name || item.userName || 'Unknown'}
                </Text>
              </TouchableOpacity>
            </View>
            {timeAgo ? <Text style={styles.commentTime}>{timeAgo}</Text> : null}
            <Text style={styles.commentText}>
              {item.content || item.text || ''}
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            {canReport && (
              <TouchableOpacity
                onPress={() => openReportModal(item)}
                style={styles.reportButton}
              >
                <FontAwesomeIcon
                  icon={Icons.Flag}
                  size={14}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(item.id)}
                disabled={isDeletingThis}
                style={styles.deleteButton}
              >
                {isDeletingThis ? (
                  <ActivityIndicator size="small" color={secondaryTextColor} />
                ) : (
                  <FontAwesomeIcon
                    icon={Icons.TrashCan}
                    size={16}
                    color={secondaryTextColor}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      hasAdminAccess,
      isDeleting,
      formatTimeAgo,
      navigation,
      openReportModal,
      handleDeleteComment,
    ]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FontAwesomeIcon
            icon={Icons.Comments}
            size={20}
            color={primaryColor}
          />
          <Text style={styles.headerTitle}>{t('comments') || 'Comments'}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {comments.length || commentsCount || 0}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            bottomSheetRef.current?.dismiss();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    ),
    [comments.length, commentsCount, t]
  );

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <FontAwesomeIcon
          icon={Icons.Comments}
          size={48}
          color={secondaryTextColor}
        />
        <Text style={styles.emptyText}>
          {t('no-comments-yet') || 'No comments yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {t('be-first-to-comment') || 'Be the first to comment!'}
        </Text>
      </View>
    );
  }, [isLoading, t]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
        return;
      }

      if (!isKeyboardOpenRef.current) {
        lastStableIndex.current = index;
      }
    },
    [onClose]
  );

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={STARTING_INDEX}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: bottomModalBgColor }}
        enablePanDownToClose
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'extend'}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        topInset={insets.top}
        enableOverDrag={false}
        animateOnMount
        enableDynamicSizing={false}
        footerComponent={renderFooter}
      >
        <BottomSheetFlatList
          ref={commentsListRef}
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          stickyHeaderIndices={[0]}
          contentContainerStyle={styles.listContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>

      <ReportCommentModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setCommentToReport(null);
        }}
        onSave={handleReportComment}
      />
    </>
  );
};

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: bottomModalBgColor,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryTextColor,
    marginLeft: 8,
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: secondaryTextColor,
  },
  listContentContainer: {
    paddingBottom: 120,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  avatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexShrink: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: primaryTextColor,
    flexShrink: 1,
  },
  commentTime: {
    fontSize: 12,
    color: secondaryTextColor,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: primaryTextColor,
    lineHeight: 20,
    flexShrink: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexShrink: 0,
    paddingTop: 2,
  },
  reportButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryTextColor,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: secondaryTextColor,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
  footerWrapper: {
    backgroundColor: 'rgba(20,27,34,1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  inputAvatar: {
    marginRight: 12,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: primaryTextColor,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: primaryColor,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
