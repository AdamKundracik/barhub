import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Timestamp } from 'firebase/firestore';
import { PostReportModal } from '@/src/app/components/shared/Modals/ReportPostModal';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import { useTranslation } from 'react-i18next';
import { Post, UserInfo } from '@/shared';
import {
  postBgColor,
  primaryColor,
  primaryTextColor,
} from '@/src/app/utils/styles/colors';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';
import { Icons } from '@/src/app/utils/icons/icons';
import reportClient from '@/src/app/utils/services/reports.service';
import { PostOptionsModal } from '@/src/app/components/shared/Modals/PostOptionsModal';
import postService from '@/src/app/utils/services/post.service';
import { useQueryClient } from 'react-query';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { getAuth } from 'firebase/auth';

const normalizeTimestamp = (timestamp: FirebaseTimestamp): Timestamp => {
  const seconds = timestamp?._seconds || 0;
  const nanoseconds = timestamp?._nanoseconds || 0;
  return new Timestamp(seconds, nanoseconds);
};

type Props = {
  date: FirebaseTimestamp;
  address: string;
  profileImage: string | null;
  user: UserInfo | undefined;
  postId: string;
  postUserId: string;
};

const UserLineComponent = ({
  postId,
  user,
  date,
  address,
  postUserId,
}: Props) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { placeId } = usePlaceStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const auth = getAuth();

  // --- MEMOIZED VALUES ---
  const normalizedDate = useMemo(
    () => new Date(normalizeTimestamp(date).toMillis()).toLocaleString(),
    [date]
  );

  const isOwnPost = useMemo(
    () => auth.currentUser?.uid === postUserId,
    [auth.currentUser?.uid, postUserId]
  );

  // --- CALLBACKS ---
  const handleReport = useCallback(
    async (reason: ReportReason) => {
      try {
        await reportClient.reportPost(postId, user?.id || '', reason);
        showSuccessToast(
          t('reportPost.confirmTitle'),
          t('reportPost.confirmMessage', { reason: t(`reportPost.${reason}`) })
        );
      } catch (error: any) {
        console.error('Failed to report post:', error);
        showErrorToast('Failed to report post', error.message);
      } finally {
        setIsReportModalOpen(false);
      }
    },
    [postId, user?.id, showSuccessToast, showErrorToast, t]
  );

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

  const deletePost = useCallback(
    async (postId: string, placeId: string | null) => {
      try {
        const result = await postService.deletePost(postId);
        if (!result.success) throw new Error('Failed to delete post');

        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: Post) => p.id !== postId),
          }));
          return {
            ...oldData,
            pages: newPages,
            pageParams: [...oldData.pageParams],
          };
        });

        if (placeId) {
          queryClient.setQueryData(['posts', placeId], (oldData: any) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((p: Post) => p.id !== postId),
            }));
            return {
              ...oldData,
              pages: newPages,
              pageParams: [...oldData.pageParams],
            };
          });
        }

        showSuccessToast(
          t('deletePost.successTitle'),
          t('deletePost.successDescription')
        );
      } catch (error: any) {
        console.error('Failed to delete post:', error);
        showErrorToast('Failed to delete post', error.message);
      } finally {
        setIsOptionsModalOpen(false);
      }
    },
    [queryClient, placeId, showSuccessToast, showErrorToast, t]
  );

  const handleDelete = useCallback(
    () => confirmDelete(() => deletePost(postId, placeId)),
    [confirmDelete, deletePost, postId, placeId]
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.image}>
              <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <Path
                  d="M25.0003 6.28979e-05C11.1864 6.28979e-05 0 11.2423 0 25.1251C0 28.7049 0.749508 32.1595 2.18752 35.4251C2.37551 35.9281 3.00053 36.1171 3.43754 35.9281C3.93803 35.7392 4.12604 35.111 3.93803 34.6719C2.62452 31.6563 1.93851 28.5157 1.93851 25.1859C1.93851 12.3734 12.3149 2.0093 25 2.0093C37.6883 2.0093 48.0615 12.3118 48.0615 25.125C48.0615 28.4545 47.373 31.5953 46.062 34.6109C45.874 35.1139 46.062 35.6782 46.5625 35.8672C46.687 35.931 46.8115 35.931 46.9385 35.931C47.3144 35.931 47.627 35.7421 47.8125 35.3666C49.2505 32.1597 50 28.7054 50 25.125C50 11.2422 38.8142 6.28979e-05 25.0003 6.28979e-05Z"
                  fill="white"
                />
                <Path
                  d="M5.11153 39.7802C4.9194 40.1574 4.98427 40.5958 5.23879 40.8455C10.1595 46.6765 17.3133 50 24.9789 50C32.6444 50 39.7983 46.6768 44.6544 40.9734C44.6544 40.9734 44.6544 40.9098 44.7193 40.9098C44.7842 40.8461 44.7842 40.7849 44.8465 40.7849C44.8465 40.7212 44.9114 40.66 44.9114 40.66C45.0387 40.4102 45.0387 40.0967 44.8465 39.8444C41.7175 34.2658 36.3499 30.4405 30.1542 28.9979C33.5404 27.1808 35.7762 23.669 35.7762 19.6579C35.7762 13.7657 30.9203 9 24.9166 9C18.913 9 14.0571 13.7657 14.0571 19.6579C14.0571 23.6692 16.3578 27.181 19.679 28.9979C13.6729 30.3766 8.24355 34.2017 5.11153 39.7802ZM16.1007 19.5937C16.1007 14.7668 20.0608 10.8805 24.9787 10.8805C29.8967 10.8805 33.8567 14.767 33.8567 19.5937C33.8567 24.3593 29.8967 28.3068 24.9787 28.3068C20.0608 28.3068 16.1007 24.4203 16.1007 19.5937ZM24.9787 30.2515C32.3249 30.2515 39.0322 34.0768 42.7379 40.1577C38.2663 45.1731 31.8132 48.1191 24.9787 48.1191C18.2062 48.1191 11.8182 45.2342 7.21956 40.1577C10.9899 34.0132 17.6971 30.2515 24.9787 30.2515Z"
                  fill="white"
                />
              </Svg>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.name}>{user?.displayName}</Text>
            <Text style={styles.dateTimeText}>{normalizedDate}</Text>
            <Text style={styles.address}>{address}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setIsOptionsModalOpen(true)}>
          <FontAwesomeIcon
            icon={Icons.EllipsisVertical}
            size={24}
            color={'white'}
          />
        </TouchableOpacity>
      </View>

      <PostOptionsModal
        showDelete={isOwnPost}
        visible={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={handleDelete}
        onReport={() => {
          setIsOptionsModalOpen(false);
          setIsReportModalOpen(true);
        }}
      />

      <PostReportModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSave={handleReport}
      />
    </>
  );
};

export const UserLine = React.memo(UserLineComponent, (prev, next) => {
  return (
    prev.postId === next.postId &&
    prev.user?.id === next.user?.id &&
    prev.date._seconds === next.date._seconds &&
    prev.date._nanoseconds === next.date._nanoseconds &&
    prev.address === next.address &&
    prev.postUserId === next.postUserId
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: postBgColor,
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
  dateTimeText: {
    fontSize: 14,
    color: primaryTextColor,
    marginVertical: 2,
  },
  address: {
    fontSize: 14,
    color: '#999999',
  },
});
