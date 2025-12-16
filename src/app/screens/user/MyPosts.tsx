import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '../../utils/styles/colors';
import { ScreenLayout } from '../../components/shared/Layouts/ScreenLayout';
import { useUserStore } from '../../utils/store/userStore';
import { useUserPosts } from '../../hooks/useUserPosts';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 32; // ScreenLayout má paddingHorizontal: 16 (2x16)
const GRID_GAP = 4;
const COLUMNS = 3;
const ITEM_WIDTH =
  (width - SCREEN_PADDING - GRID_GAP * (COLUMNS - 1) - 6) / COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * (4 / 3); // 3:4 aspect ratio

export const MyPosts: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { getUserId } = useUserStore();
  const userId = getUserId();
  const { posts, isLoading, refetch } = useUserPosts(userId || undefined);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case 'EMPTY':
      case 'LOW':
        return { backgroundColor: 'rgba(68, 170, 68, 0.9)' };
      case 'SPARSELY_OCCUPIED':
      case 'MEDIUM':
        return { backgroundColor: 'rgba(255, 187, 0, 0.9)' };
      case 'ALMOST_FULL':
      case 'HIGH':
        return { backgroundColor: 'rgba(255, 136, 0, 0.9)' };
      case 'FULL':
        return { backgroundColor: 'rgba(255, 68, 68, 0.9)' };
      default:
        return { backgroundColor: 'rgba(158, 158, 158, 0.9)' };
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <FontAwesomeIcon
          icon={Icons.Image}
          size={64}
          color={secondaryTextColor}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {t('no-posts-yet') || 'No posts yet'}
      </Text>
      <Text style={styles.emptyMessage}>
        {t('my-posts-empty-message') ||
          "You haven't created any posts yet. Start sharing your experiences!"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenLayout
        title={t('my-posts') || 'My Posts'}
        showTitle={true}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={t('my-posts') || 'My Posts'}
      showTitle={true}
      showBackButton={true}
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          posts.length === 0 && styles.emptyScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {posts.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.countText}>
                {t('my-posts-count', { count: posts.length })}
              </Text>
            </View>
            <View style={styles.grid}>
              {posts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  onPress={() => handlePostPress(post.id)}
                  activeOpacity={0.8}
                >
                  <FastImage
                    source={{ uri: post.photoUrl || '' }}
                    style={styles.postImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View
                    style={[
                      styles.occupancyDot,
                      getOccupancyColor(post.occupancy),
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: secondaryTextColor,
  },
  header: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: secondaryTextColor,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  occupancyDot: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryTextColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: secondaryTextColor,
    textAlign: 'center',
    lineHeight: 24,
  },
});
