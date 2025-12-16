import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import { Icons } from '@/src/app/utils/icons/icons';
import { Post } from '@/src/app/types/postTypes';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';

const { width } = Dimensions.get('window');
const ACCOUNT_PADDING = 40; // Account.tsx má paddingHorizontal: 20 (2x20)
const GRID_GAP = 4; // Malý gap medzi fotkami
const COLUMNS = 3;
// Calculate item width: screen width - account padding - gaps between items - border width
const ITEM_WIDTH = (width - ACCOUNT_PADDING - GRID_GAP * (COLUMNS - 1) - 6) / COLUMNS; // -6 pre borders (2px × 3 items)
const ITEM_HEIGHT = ITEM_WIDTH * (4 / 3); // 3:4 aspect ratio (portrait)

interface MyPostsGridProps {
  posts: Post[];
  isLoading?: boolean;
}

export const MyPostsGrid: React.FC<MyPostsGridProps> = ({
  posts,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePostPress = (postId: string) => {
    (navigation as any).navigate('PostDetail', { postId: postId });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesomeIcon icon={Icons.Image} size={20} color={primaryColor} />
          <Text style={styles.title}>{t('my-posts') || 'My Posts'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('loading')}...</Text>
        </View>
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesomeIcon icon={Icons.Image} size={20} color={primaryColor} />
          <Text style={styles.title}>{t('my-posts') || 'My Posts'}</Text>
          <Text style={styles.count}>0</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon
            icon={Icons.Image}
            size={32}
            color={secondaryTextColor}
          />
          <Text style={styles.emptyText}>
            {t('no-posts-yet') || 'No posts yet'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesomeIcon icon={Icons.Image} size={20} color={primaryColor} />
        <Text style={styles.title}>{t('my-posts') || 'My Posts'}</Text>
        <Text style={styles.count}>{posts.length}</Text>
      </View>

      <View style={styles.grid}>
        {posts.map((post) => {
          return (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              onPress={() => handlePostPress(post.id)}
              activeOpacity={0.8}
            >
              {/* Post Image */}
              <FastImage
                source={{ uri: post.photoUrl || '' }}
                style={styles.postImage}
                resizeMode={FastImage.resizeMode.cover}
              />

              {/* Occupancy Indicator - solid color dot */}
              <View style={[styles.occupancyDot, getOccupancyColor(post.occupancy)]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Helper functions - using same colors as PostSummary
const getOccupancyColor = (occupancy: string) => {
  switch (occupancy) {
    case 'EMPTY':
    case 'LOW':
      return { backgroundColor: 'rgba(68, 170, 68, 0.9)' }; // #44AA44
    case 'SPARSELY_OCCUPIED':
    case 'MEDIUM':
      return { backgroundColor: 'rgba(255, 187, 0, 0.9)' }; // #FFBB00
    case 'ALMOST_FULL':
    case 'HIGH':
      return { backgroundColor: 'rgba(255, 136, 0, 0.9)' }; // #FF8800
    case 'FULL':
      return { backgroundColor: 'rgba(255, 68, 68, 0.9)' }; // #FF4444
    default:
      return { backgroundColor: 'rgba(158, 158, 158, 0.9)' };
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 24, // 1.5rem spacing below
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryTextColor,
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: primaryColor,
    backgroundColor: 'rgba(16, 217, 185, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.3)',
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

