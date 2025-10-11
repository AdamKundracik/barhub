import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import { Icons } from '@/src/app/utils/icons/icons';
import { PostHighlightDTO } from '@/src/app/types/dto';
import {
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';

const { width } = Dimensions.get('window');
const ACCOUNT_PADDING = 40; // Account.tsx má paddingHorizontal: 20 (2x20)
const GRID_GAP = 4; // Malý gap medzi fotkami
const COLUMNS = 3;
const MAX_ROWS = 2;
const MAX_ITEMS = COLUMNS * MAX_ROWS; // 6 posts max
// Calculate item width: screen width - account padding - gaps between items - border width
const ITEM_WIDTH = (width - ACCOUNT_PADDING - GRID_GAP * (COLUMNS - 1) - 6) / COLUMNS; // -6 pre borders (2px × 3 items)
const ITEM_HEIGHT = ITEM_WIDTH * (4 / 3); // 3:4 aspect ratio (portrait)

interface HighlightedPostsGridProps {
  highlights: PostHighlightDTO[];
  isLoading?: boolean;
}

export const HighlightedPostsGrid: React.FC<HighlightedPostsGridProps> = ({
  highlights,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePostPress = (postId: number) => {
    (navigation as any).navigate('PostDetail', { postId: postId.toString() });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesomeIcon icon={Icons.Bolt} size={20} color="#FFC107" />
          <Text style={styles.title}>{t('highlighted-posts')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('loading')}...</Text>
        </View>
      </View>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesomeIcon icon={Icons.Bolt} size={20} color="#FFC107" />
          <Text style={styles.title}>{t('highlighted-posts')}</Text>
          <Text style={styles.count}>0</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon
            icon={Icons.Bolt}
            size={32}
            color={secondaryTextColor}
          />
          <Text style={styles.emptyText}>
            {t('no-highlighted-posts')}
          </Text>
        </View>
      </View>
    );
  }

  // Take only first 6 posts (3 columns × 2 rows)
  const displayedHighlights = highlights.slice(0, MAX_ITEMS);
  const hasMore = highlights.length > MAX_ITEMS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesomeIcon icon={Icons.Bolt} size={20} color="#FFC107" />
        <Text style={styles.title}>{t('highlighted-posts')}</Text>
        <Text style={styles.count}>{highlights.length}</Text>
      </View>

      <View style={styles.grid}>
        {displayedHighlights.map((highlight) => {
          const post = highlight.post;
          if (!post) return null;

          return (
            <TouchableOpacity
              key={highlight.id}
              style={styles.gridItem}
              onPress={() => handlePostPress(highlight.postId)}
              activeOpacity={0.8}
            >
              {/* Post Image */}
              <FastImage
                source={{ uri: post.metadata?.photoUrl || '' }}
                style={styles.postImage}
                resizeMode={FastImage.resizeMode.cover}
              />

              {/* Highlight Badge */}
              <View style={styles.highlightBadge}>
                <FontAwesomeIcon icon={Icons.Bolt} size={12} color="#FFC107" />
              </View>

              {/* Occupancy Indicator - solid color dot */}
              <View style={[styles.occupancyDot, getOccupancyColor(post.occupancy)]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {hasMore && (
        <Text style={styles.moreText}>
          +{highlights.length - MAX_ITEMS} more highlighted posts
        </Text>
      )}
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

const getOccupancyEmoji = (occupancy: string) => {
  switch (occupancy) {
    case 'LOW':
      return '🟢';
    case 'MEDIUM':
      return '🟡';
    case 'HIGH':
      return '🟠';
    case 'FULL':
      return '🔴';
    default:
      return '⚪';
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
    color: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
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
    borderColor: '#FFC107',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  highlightBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.5)',
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
  moreText: {
    fontSize: 13,
    color: secondaryTextColor,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

