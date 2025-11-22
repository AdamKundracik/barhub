import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { primaryColor } from '../../utils/styles/colors';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useLeaderboard } from '@/src/app/utils/hooks/useLeaderboard';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useUserRole } from '@/src/app/hooks/useUserRole'; // Define LeaderboardUser interface locally to match backend data

// Define LeaderboardUser interface locally to match backend data
interface LeaderboardUser {
  userId: string;
  name: string;
  photoUrl: string;
  points: number;
  rank?: number | null;
}

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
  const navigation = useNavigation();
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

  const handleUserPress = () => {
    (navigation as any).navigate('UserDetail', { userId: user.userId });
  };

  return (
    <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
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
        <Avatar
          size="lg"
          style={[
            styles.avatar,
            isTopThree && {
              borderColor: topThreeColors?.border,
              borderWidth: 2.5,
            },
          ]}
        >
          {user.photoUrl ? (
            <AvatarImage source={{ uri: user.photoUrl }} />
          ) : (
            <AvatarFallbackText className={'text-white'}>
              {user.name}
            </AvatarFallbackText>
          )}
        </Avatar>

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
            {user.name}
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
    </TouchableOpacity>
  );
};

const LeaderboardScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'week' | 'monthly' | 'yearly'>(
    'week'
  );
  const [animationKey, setAnimationKey] = useState('0'); // Kľúč pre resetovanie animácií
  const { data, isLoading, error, refetch } = useLeaderboard(selectedTab);
  const { isAdmin, isModerator } = useUserRole();

  const { t } = useTranslation();

  const topUsers: LeaderboardUser[] = data?.topUsers || [];
  const currentUser: LeaderboardUser | null = data?.currentUser || null;
  const isCurrentInTop = data?.currentUserInTop100 || false;

  // Výška bottom tabs (rovnaká logika ako v BottomTabs.tsx)
  const bottomTabsHeight = Platform.OS === 'ios' ? 90 : 80;

  const handleTabChange = async (tab: 'week' | 'monthly' | 'yearly') => {
    // Ak je už vybraná tá istá možnosť, nerob nič
    if (selectedTab === tab) {
      return;
    }
    setSelectedTab(tab);
    // Resetovanie animačného kľúča pre nové animácie
    setAnimationKey(prev => (parseInt(prev) + 1).toString());
    await refetch();
  };

  const exportToCSV = async () => {
    try {
      if (!topUsers || topUsers.length === 0) {
        Alert.alert('No Data', 'No leaderboard data to export');
        return;
      }

      // CSV Header
      const header = 'Rank,ID,Username,Points\n';

      // CSV Rows - len id, name, points (bez photoUrl)
      const rows = topUsers
        .map((user, index) => {
          const rank = index + 1;
          const id = user.userId;
          const name = user.name.replace(/,/g, ''); // Remove commas from name
          const points = user.points;
          return `${rank},${id},"${name}",${points}`;
        })
        .join('\n');

      const csvContent = header + rows;

      // Create filename with period and date
      const periodLabel =
        selectedTab === 'week'
          ? 'Weekly'
          : selectedTab === 'monthly'
            ? 'Monthly'
            : 'Yearly';
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `Leaderboard_${periodLabel}_${date}.csv`;

      // Save to file system
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Leaderboard',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Success', `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  // Resetovanie animácií pri zmene dát
  useEffect(() => {
    if (data) {
      setAnimationKey(prev => (parseInt(prev) + 1).toString());
    }
  }, [data]);

  return (
    <ScreenLayout title={`🏆 ${t('leaderboard.topUsers')}`} showTitle>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {selectedTab === 'week'
            ? t('leaderboard.week')
            : selectedTab === 'monthly'
              ? t('leaderboard.monthly')
              : t('leaderboard.yearly')}
        </Text>

        {/* Export Button - Only for Admin/Moderator */}
        {(isAdmin || isModerator) && (
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportToCSV}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={faDownload} size={18} color="black" />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        )}
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
            activeOpacity={selectedTab === 'week' ? 1 : 0.7}
            disabled={selectedTab === 'week'}
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
              selectedTab === 'monthly' && styles.tabButtonActive,
            ]}
            onPress={() => handleTabChange('monthly')}
            activeOpacity={selectedTab === 'monthly' ? 1 : 0.7}
            disabled={selectedTab === 'monthly'}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'monthly' && styles.tabTextActive,
              ]}
            >
              {t('leaderboard.monthly')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'yearly' && styles.tabButtonActive,
            ]}
            onPress={() => handleTabChange('yearly')}
            activeOpacity={selectedTab === 'yearly' ? 1 : 0.7}
            disabled={selectedTab === 'yearly'}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'yearly' && styles.tabTextActive,
              ]}
            >
              {t('leaderboard.yearly')}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      <FlashList
        contentContainerStyle={{
          paddingBottom:
            !isCurrentInTop && currentUser
              ? bottomTabsHeight + 80
              : bottomTabsHeight,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
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
          <Text style={styles.errorText}>
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  exportButtonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 14,
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
  avatarFallback: {
    backgroundColor: 'black',
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
