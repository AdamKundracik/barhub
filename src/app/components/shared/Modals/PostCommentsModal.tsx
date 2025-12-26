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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
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

type PostCommentsModalProps = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  commentsCount?: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
};

// Footer component - manages its own comment state
type CommentInputFooterProps = {
  userData: any;
  currentUserId: string;
  handleComment: (comment: string) => Promise<boolean>;
  isPosting: boolean;
  t: (key: string) => string;
};

const CommentInputFooter: React.FC<CommentInputFooterProps> = ({
  userData,
  currentUserId,
  handleComment,
  isPosting,
  t,
}) => {
  // Footer manages its own comment state
  const [comment, setComment] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!comment.trim() || isPosting) return;

    const success = await handleComment(comment);
    if (success) {
      // Clear input only on success
      setComment('');
    }
    // On error, keep the comment so user can retry
  }, [comment, isPosting, handleComment]);

  return (
    <View style={styles.footerContainer}>
      <Avatar size="sm" style={styles.inputAvatar}>
        {userData?.photoUrl ? (
          <AvatarImage
            key={createImageKey(
              'comment-input',
              currentUserId,
              userData.photoUrl
            )}
            source={{
              uri: addCacheBuster(userData.photoUrl, currentUserId),
            }}
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
  );
};

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

  // Fixed snap points - keyboard handling is managed by BottomSheetModal
  const snapPoints = useMemo(() => ['50%', '70%'], []);

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

  // Update current time every minute for live time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Helper function to format time ago with translations
  const formatTimeAgo = useCallback(
    (date: Date | string | undefined): string => {
      if (!date) return '';

      try {
        // Parse date string if needed
        let dateObj: Date;
        if (typeof date === 'string') {
          // Backend sends LocalDateTime as string: "2025-10-07T22:29:23.517475"
          let dateStr = date.includes('T') ? date : date.replace(' ', 'T');

          // Add 'Z' suffix to indicate UTC time
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

        // Calculate difference using current time (updates every minute)
        const diffInSeconds = Math.floor(
          (currentTime.getTime() - dateObj.getTime()) / 1000
        );
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        // Less than 1 day - use relative time
        if (diffInDays < 1) {
          if (diffInMinutes < 1) {
            return t('just-now') || 'just now';
          } else if (diffInMinutes < 60) {
            // Special handling for Spanish, Slovak, and German - "pred/vor/hace X min" instead of "X min pred/vor/hace"
            if (
              i18n.language === 'es' ||
              i18n.language === 'sk' ||
              i18n.language === 'de'
            ) {
              return `${t('ago')} ${diffInMinutes} min`;
            }
            return `${diffInMinutes} min ${t('ago')}`;
          } else {
            // Special handling for Spanish, Slovak, and German - "pred/vor/hace Xh" instead of "Xh pred/vor/hace"
            if (
              i18n.language === 'es' ||
              i18n.language === 'sk' ||
              i18n.language === 'de'
            ) {
              return `${t('ago')} ${diffInHours}h`;
            }
            return `${diffInHours}h ${t('ago')}`;
          }
        }

        // More than 1 day - show date and time in local timezone
        const userLocale = locales[0]?.languageTag || 'en-US';
        return dateObj.toLocaleDateString(userLocale, {
          month: 'short',
          day: 'numeric',
          ...(diffInDays < 365 && { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (e) {
        return '';
      }
    },
    [currentTime, t, i18n.language, locales]
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      loadComments();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, postId]);

  const loadComments = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const fetchedComments = await commentService.getCommentsForPost(
        postId,
        0,
        100 // Load first 100 comments
      );
      // Reverse to show newest first (or oldest first, depending on backend order)
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

        // Add to list (prepend for newest first)
        setComments(prev => [addedComment, ...prev]);

        // Scroll to top to show new comment
        setTimeout(() => {
          commentsListRef.current?.scrollToIndex({
            index: 0,
            animated: true,
          });
        }, 100);

        // Notify parent component
        onCommentAdded?.();

        // Dismiss keyboard
        Keyboard.dismiss();

        // Return success - footer will clear its own state
        return true;
      } catch (error: any) {
        console.error('Error adding comment:', error);

        const status = error?.response?.status;
        const errorData: ErrorResponse = error?.response?.data || {};
        const errorCode = errorData.errorCode;
        const errorMessage = errorData.message || error?.message || '';

        // Handle 409 Conflict - Comment too soon (30s delay)
        if (status === 409 && errorCode === CommentErrorCode.COMMENT_TOO_SOON) {
          const remainingSeconds = errorData.remainingSeconds || 30;
          showErrorToast(
            t('error') || 'Error',
            t('comment-spam-delay-with-time', { seconds: remainingSeconds }) ||
              `Please wait ${remainingSeconds} seconds before commenting again to prevent spam`
          );
        } else {
          // Generic error handling
          showErrorToast(
            t('error') || 'Error',
            errorMessage ||
              t('failed-to-add-comment') ||
              'Failed to add comment'
          );
        }

        // Return false on error - footer will keep the comment
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

      // Show confirmation alert
      Alert.alert(
        t('delete-comment') || 'Delete Comment',
        t('delete-comment-confirm') ||
          'Are you sure you want to delete this comment?',
        [
          {
            text: t('cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('delete') || 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(commentId);
              try {
                await commentService.deleteComment(commentId);
                // Remove from list
                setComments(prev => prev.filter(c => c.id !== commentId));
                // Notify parent component
                onCommentDeleted?.();
                showSuccessToast(
                  t('success') || 'Success',
                  t('comment-deleted') || 'Comment deleted'
                );
              } catch (error: any) {
                console.error('Error deleting comment:', error);
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
      />
    ),
    []
  );

  const handleReportComment = useCallback(
    async (reason: ReportReason, customReason?: string) => {
      if (!commentToReport) return;

      try {
        // Convert ReportReason to ReasonTypeEnum (they have the same values)
        // Both enums have identical string values, so we can safely cast
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
        console.error('Error reporting comment:', error);

        const status = error?.response?.status;
        const errorData: ErrorResponse = error?.response?.data || {};
        const errorCode = errorData.errorCode;
        const errorMessage = errorData.message || error?.message || '';

        // Handle 409 Conflict - Already reported
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
          // Generic error handling
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

  // Footer component with input - stays sticky at bottom and reacts to keyboard
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (!currentUserId) return null;

      return (
        <BottomSheetFooter key="comment-footer" {...props} bottomInset={0}>
          <CommentInputFooter
            userData={userData}
            currentUserId={currentUserId}
            handleComment={handleAddComment}
            isPosting={isPosting}
            t={t}
          />
        </BottomSheetFooter>
      );
    },
    [currentUserId, userData, insets.bottom, t, handleAddComment, isPosting]
  );

  const renderCommentItem = ({ item }: { item: PostComment }) => {
    const canDelete = item.canDelete || hasAdminAccess;
    const canReport = item.canReport; // Default to true if not set
    const isDeletingThis = isDeleting === item.id;

    // Parse creation time
    let timeAgo = '';
    if (item.createdAt) {
      timeAgo = formatTimeAgo(item.createdAt);
    } else if (item.creationTime) {
      timeAgo = formatTimeAgo(item.creationTime);
    }

    // Get user ID for navigation
    const commentUserId = item.user?.id || item.userId;
    const handleUserPress = () => {
      if (commentUserId) {
        onClose(); // Close modal first
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
            {timeAgo ? <Text style={styles.commentTime}>{timeAgo}</Text> : null}
          </View>
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
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={1}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: bottomModalBgColor }}
      handleHeight={24}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      topInset={insets.top}
      enableOverDrag={false}
      animateOnMount={true}
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <FontAwesomeIcon
              icon={Icons.Comments}
              size={20}
              color={primaryColor}
            />
            <Text style={styles.headerTitle}>
              {t('comments') || 'Comments'}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {comments.length || commentsCount || 0}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>{t('close') || 'Close'}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>
              {t('loading') || 'Loading...'}
            </Text>
          </View>
        ) : comments.length > 0 ? (
          <FlashList
            ref={commentsListRef}
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={item => item.id}
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
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
        )}
      </BottomSheetScrollView>

      {/* Report Comment Modal */}
      <ReportCommentModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setCommentToReport(null);
        }}
        onSave={handleReportComment}
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for footer to prevent overlap
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  commentsList: {
    flex: 1,
    marginTop: 16,
  },
  commentsListContent: {
    paddingBottom: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    flexDirection: 'column',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: primaryTextColor,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: secondaryTextColor,
  },
  commentText: {
    fontSize: 15,
    color: primaryTextColor,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 1,
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
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
  footerContainer: {
    // marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(20,27,34,1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
