import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Timestamp } from 'firebase/firestore';
import { PostReportModal } from '@/src/app/components/user/NewsFeed/Post/ReportPostModal';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from '@/components/ui/toast';
import { useTranslation } from 'react-i18next';
import { UserInfo } from '@/shared';
import {
  postBgColor,
  primaryColor,
  primaryTextColor,
} from '@/src/app/utils/styles/colors';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';
import { Icons } from '@/src/app/utils/icons/icons';
import reportClient from '@/src/app/utils/services/reports.service';

const normalizeTimestamp = (timestamp: FirebaseTimestamp): Timestamp => {
  const seconds = timestamp.seconds || timestamp._seconds || 0;
  const nanoseconds = timestamp.nanoseconds || timestamp._nanoseconds || 0;
  return new Timestamp(seconds, nanoseconds);
};

type Props = {
  date: FirebaseTimestamp;
  address: string;
  profileImage: string | null;
  user: UserInfo | undefined;
  postId: string;
};

export const UserLine = (props: Props) => {
  const { postId } = props;
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();
  const [toastId, setToastId] = useState('');

  const handleReport = async (reason: ReportReason) => {
    try {
      // Call the cloud function to report the post
      const result = await reportClient.reportPost(
        postId,
        props.user?.id || '',
        reason
      );

      console.log('Reported post with ID:', result.report.id);
      setIsReportModalOpen(false);
      handleToast();
    } catch (error: any) {
      console.error('Failed to report post:', error);
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast
            onTouchCancel={() => {}}
            nativeID={'error-toast-' + id}
            action="error"
            variant="outline"
            style={{
              backgroundColor: '#1F1F1F', // Dark background for error
              borderColor: '#FF4D4F', // Red border
              borderWidth: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
              width: '100%',
            }}
          >
            <ToastTitle
              style={{
                color: '#FF4D4F',
                fontWeight: 'bold',
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              Error
            </ToastTitle>
            <ToastDescription
              style={{
                color: '#E0E0E0',
                fontSize: 14,
                lineHeight: 18,
              }}
            >
              {error.message || 'Could not report post.'}
            </ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handleToast = () => {
    if (!toast.isActive(toastId)) {
      showNewToast();
    }
  };

  const showNewToast = () => {
    const newId = Math.random().toString();
    setToastId(newId);
    toast.show({
      id: newId,
      placement: 'top right',
      duration: 3000,
      render: ({ id }) => {
        const uniqueToastId = 'toast-' + id;
        return (
          <Toast
            onTouchCancel={() => setToastId(id)}
            nativeID={uniqueToastId}
            action="success"
            variant="outline"
            style={{
              backgroundColor: 'rgba(20,27,34,0.95)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#333',
              paddingVertical: 12,
              paddingHorizontal: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <ToastTitle
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              {t('reportPost.successTitle')}
            </ToastTitle>
            <ToastDescription
              style={{
                color: '#aaa',
                fontSize: 14,
                lineHeight: 18,
              }}
            >
              {t('reportPost.successDescription')}
            </ToastDescription>
          </Toast>
        );
      },
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {props.user?.photoUrl ? (
            <Image
              source={{
                uri: props.user.photoUrl,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.image}>
              <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                {/* tvoj SVG avatar */}
                <Path
                  d="M25.0003 6.28979e-05C11.1864 6.28979e-05 0 11.2423 0 25.1251C0 28.7049 0.749508 32.1595 2.18752 35.4251C2.37551 35.9281 3.00053 36.1171 3.43754 35.9281C3.93803 35.7392 4.12604 35.111 3.93803 34.6719C2.62452 31.6563 1.93851 28.5157 1.93851 25.1859C1.93851 12.3734 12.3149 2.0093 25 2.0093C37.6883 2.0093 48.0615 12.3118 48.0615 25.125C48.0615 28.4545 47.373 31.5953 46.062 34.6109C45.874 35.1139 46.062 35.6782 46.5625 35.8672C46.687 35.931 46.8115 35.931 46.9385 35.931C47.3144 35.931 47.627 35.7421 47.8125 35.3666C49.2505 32.1597 50 28.7054 50 25.125C50 11.2422 38.8142 6.28979e-05 25.0003 6.28979e-05Z"
                  fill={'white'}
                />
                <Path
                  d="M5.11153 39.7802C4.9194 40.1574 4.98427 40.5958 5.23879 40.8455C10.1595 46.6765 17.3133 50 24.9789 50C32.6444 50 39.7983 46.6768 44.6544 40.9734C44.6544 40.9734 44.6544 40.9098 44.7193 40.9098C44.7842 40.8461 44.7842 40.7849 44.8465 40.7849C44.8465 40.7212 44.9114 40.66 44.9114 40.66C45.0387 40.4102 45.0387 40.0967 44.8465 39.8444C41.7175 34.2658 36.3499 30.4405 30.1542 28.9979C33.5404 27.1808 35.7762 23.669 35.7762 19.6579C35.7762 13.7657 30.9203 9 24.9166 9C18.913 9 14.0571 13.7657 14.0571 19.6579C14.0571 23.6692 16.3578 27.181 19.679 28.9979C13.6729 30.3766 8.24355 34.2017 5.11153 39.7802ZM16.1007 19.5937C16.1007 14.7668 20.0608 10.8805 24.9787 10.8805C29.8967 10.8805 33.8567 14.767 33.8567 19.5937C33.8567 24.3593 29.8967 28.3068 24.9787 28.3068C20.0608 28.3068 16.1007 24.4203 16.1007 19.5937ZM24.9787 30.2515C32.3249 30.2515 39.0322 34.0768 42.7379 40.1577C38.2663 45.1731 31.8132 48.1191 24.9787 48.1191C18.2062 48.1191 11.8182 45.2342 7.21956 40.1577C10.9899 34.0132 17.6971 30.2515 24.9787 30.2515Z"
                  fill={'white'}
                />
              </Svg>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.name}>{props.user?.displayName}</Text>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateTimeText}>
                {new Date(
                  normalizeTimestamp(props.date).toMillis()
                ).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.address}>{props.address}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setIsReportModalOpen(true)}
        >
          <FontAwesomeIcon icon={Icons.Flag} size={20} color={'#FE7878'} />
        </TouchableOpacity>
      </View>

      <PostReportModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSave={handleReport}
      />
    </>
  );
};

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
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  dateTimeText: {
    fontSize: 14,
    color: primaryTextColor,
  },
  address: {
    fontSize: 14,
    color: '#999999',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});

export default UserLine;
