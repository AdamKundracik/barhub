import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { primaryColor } from '../../utils/styles/colors';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { useTranslation } from 'react-i18next';
import { LeaderboardUser } from '@/src/app/utils/services/leaderboard-service';
import { useLeaderboard } from '@/src/app/utils/hooks/useLeaderboard';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';

const medalMap = [
  require('../../../../assets/gold-medal.png'),
  require('../../../../assets/silver-medal.png'),
  require('../../../../assets/bronze-medal.png'),
];

interface LeaderboardRowProps {
  user: LeaderboardUser;
  rank: number | null;
  highlight?: boolean;
  index: number;
  animationKey: string; // Pridaný kľúč pre resetovanie animácií
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  user,
  rank,
  highlight,
  index,
  animationKey,
}) => {
  const isTopThree = rank !== null && rank < 3;

  // Animácia pre každý riadok - použitie useRef pre perzistentnosť
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);

    // Spustenie animácie s oneskorením podľa indexu
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 600,
      delay: index * 100, // Každý riadok sa animuje o 100ms neskôr
      useNativeDriver: true,
    }).start();
  }, [animationKey, index]); // Animácia sa resetuje pri zmene animationKey

  // Animované hodnoty
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0], // Začína 50px nižšie
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // Fade in efekt
  });

  const getTopThreeColors = (position: number) => {
    switch (position) {
      case 0: // 1. miesto - Zlatá
        return {
          text: '#FFD700',
          border: '#FFD700',
          background: 'rgba(255, 215, 0, 0.1)',
        };
      case 1: // 2. miesto - Strieborná
        return {
          text: '#C0C0C0',
          border: '#C0C0C0',
          background: 'rgba(192, 192, 192, 0.1)',
        };
      case 2: // 3. miesto - Bronzová
        return {
          text: '#CD7F32',
          border: '#CD7F32',
          background: 'rgba(205, 127, 50, 0.1)',
        };
      default:
        return null;
    }
  };

  const topThreeColors = isTopThree ? getTopThreeColors(rank!) : null;

  return (
    <Animated.View
      style={[
        styles.row,
        highlight && styles.currentUserHighlight,
        isTopThree && {
          backgroundColor: topThreeColors?.background,
          borderWidth: 1,
          borderColor: topThreeColors?.border,
        },
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {/* Medal/Rank section */}
      <View style={styles.medalContainer}>
        {isTopThree ? (
          <FastImage source={medalMap[rank]} style={styles.medal} />
        ) : (
          <View style={styles.rankBadge}>
            <Text style={styles.rank}>
              {rank !== null ? `${rank + 1}` : '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Avatar */}
      <FastImage
        source={{ uri: user.photoUrl }}
        style={[
          styles.avatar,
          isTopThree && {
            borderColor: topThreeColors?.border,
            borderWidth: 2.5,
          },
        ]}
      />

      {/* User info */}
      <View style={styles.userInfo}>
        <Text
          style={[
            styles.username,
            isTopThree && {
              color: topThreeColors?.text,
              fontWeight: 'bold',
            },
          ]}
        >
          {user.displayName}
        </Text>
      </View>

      {/* Points */}
      <Text
        style={[
          styles.points,
          isTopThree && {
            color: topThreeColors?.text,
            fontSize: 17,
          },
        ]}
      >
        {user.points} pts
      </Text>
    </Animated.View>
  );
};

const LeaderboardScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'week' | 'all'>('week');
  const [animationKey, setAnimationKey] = useState('0'); // Kľúč pre resetovanie animácií
  const { data, isLoading, error, refetch } = useLeaderboard(selectedTab);

  const { t } = useTranslation();

  const topUsers: LeaderboardUser[] = data?.topUsers || [];
  const currentUser: LeaderboardUser | null = data?.currentUser || null;
  const isCurrentInTop = topUsers.some(u => u.userId === currentUser?.userId);

  // Výška bottom tabs (rovnaká logika ako v BottomTabs.tsx)
  const bottomTabsHeight = Platform.OS === 'ios' ? 90 : 80;

  const handleTabChange = async (tab: 'week' | 'all') => {
    setSelectedTab(tab);
    // Resetovanie animačného kľúča pre nové animácie
    setAnimationKey(prev => (parseInt(prev) + 1).toString());
    await refetch();
  };

  // Resetovanie animácií pri zmene dát
  useEffect(() => {
    if (data) {
      setAnimationKey(prev => (parseInt(prev) + 1).toString());
    }
  }, [data]);

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>🏆 {t('leaderboard.topUsers')}</Text>
        <Text style={styles.subtitle}>
          {selectedTab === 'week'
            ? t('leaderboard.week')
            : t('leaderboard.allTime')}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <BlurView intensity={20} tint="dark" style={styles.tabBlur}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'week' && styles.tabButtonActive,
            ]}
            onPress={() => handleTabChange('week')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'week' && styles.tabTextActive,
              ]}
            >
              {t('leaderboard.week')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'all' && styles.tabButtonActive,
            ]}
            onPress={() => handleTabChange('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'all' && styles.tabTextActive,
              ]}
            >
              {t('leaderboard.allTime')}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* FlatList */}
      <FlashList
        contentContainerStyle={{
          paddingBottom:
            !isCurrentInTop && currentUser
              ? bottomTabsHeight + 80
              : bottomTabsHeight,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        data={topUsers}
        keyExtractor={item => item.userId}
        ListEmptyComponent={
          <View>
            {!topUsers && <Text style={styles.emptyText}>{t('no-data')}</Text>}
          </View>
        }
        renderItem={({ item, index }) => (
          <LeaderboardRow
            user={item}
            rank={index}
            highlight={currentUser?.userId === item.userId}
            index={index}
            animationKey={`${animationKey}-${index}`} // Unikátny kľúč pre každý riadok
          />
        )}
      />

      {/* Current user fixed at bottom */}
      {!isCurrentInTop && currentUser && (
        <View style={[styles.currentUserFixed, { bottom: bottomTabsHeight }]}>
          <LeaderboardRow
            user={currentUser}
            rank={null}
            highlight
            index={topUsers.length}
            animationKey={`${animationKey}-current`} // Unikátny kľúč pre aktuálneho používateľa
          />
        </View>
      )}

      {/* Error handling */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  currentUserFixed: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
    textAlign: 'center',
    marginVertical: 10,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: primaryColor,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },

  // Tab Switcher
  tabSwitcher: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(51, 51, 51, 0.3)',
  },
  tabBlur: {
    flexDirection: 'row',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 21,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: primaryColor,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  tabTextActive: {
    color: 'black',
    fontWeight: 'bold',
  },

  // Row styles s animáciou
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentUserHighlight: {
    backgroundColor: 'rgba(16, 217, 185, 0.15)',
    borderWidth: 1,
    borderColor: primaryColor,
  },

  // Medal/Rank container - jednotná šírka
  medalContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medal: {
    width: 24,
    height: 24,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },

  // Avatar - jednotná veľkosť
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // User info
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Points
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  emptyText: {
    textAlign: 'center',
    color: 'white',
    marginVertical: 24,
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;
