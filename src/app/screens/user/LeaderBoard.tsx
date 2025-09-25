import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { primaryColor } from '../../utils/styles/colors';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LeaderboardUser } from '@/src/app/utils/services/leaderboard-service';
import { useLeaderboard } from '@/src/app/utils/services/useLeaderboard';

const medalMap = [
  require('../../../../assets/gold-medal.png'),
  require('../../../../assets/silver-medal.png'),
  require('../../../../assets/bronze-medal.png'),
];

interface LeaderboardRowProps {
  user: LeaderboardUser;
  rank: number | null;
  highlight?: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  user,
  rank,
  highlight,
}) => (
  <View style={[styles.row, highlight && styles.currentUserHighlight]}>
    {rank !== null && rank < 3 ? (
      <FastImage source={medalMap[rank]} style={styles.medal} />
    ) : (
      <Text style={styles.rank}>{rank !== null ? `${rank + 1}.` : '#?'}</Text>
    )}
    <FastImage source={{ uri: user.photoUrl }} style={styles.avatar} />
    <Text style={styles.username}>{user.displayName}</Text>
    <Text style={styles.points}>{user.points} pts</Text>
  </View>
);

const LeaderboardScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'week' | 'all'>('week');
  const { data, isLoading, error, refetch } = useLeaderboard();

  const navigation = useNavigation();
  const { t } = useTranslation();

  if (isLoading)
    return (
      <ScreenLayout clickFunction={navigation.goBack}>
        <Text>Loading...</Text>
      </ScreenLayout>
    );
  if (error)
    return (
      <ScreenLayout clickFunction={navigation.goBack}>
        <Text>Error: {error.message}</Text>
      </ScreenLayout>
    );

  const topUsers: LeaderboardUser[] = data?.topUsers || [];
  const currentUser: LeaderboardUser | null = data?.currentUser || null;
  const isCurrentInTop = topUsers.some(u => u.userId === currentUser?.userId);

  return (
    <ScreenLayout clickFunction={navigation.goBack}>
      {/* Switch */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            selectedTab === 'week' && styles.switchButtonActive,
          ]}
          onPress={() => setSelectedTab('week')}
        >
          <Text
            style={
              selectedTab === 'week'
                ? styles.switchTextActive
                : styles.switchText
            }
          >
            {t('leaderboard.week')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            selectedTab === 'all' && styles.switchButtonActive,
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={
              selectedTab === 'all'
                ? styles.switchTextActive
                : styles.switchText
            }
          >
            {t('leaderboard.allTime')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>🏆 {t('leaderboard.topUsers')}</Text>

      <FlatList
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        data={topUsers}
        keyExtractor={item => item.userId}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            user={item}
            rank={index}
            highlight={currentUser?.userId === item.userId}
          />
        )}
      />

      {/* Ak current user nie je v topUsers, zobraz ho pod FlatList */}
      {!isCurrentInTop && currentUser && (
        <View style={{ marginTop: 16 }}>
          <LeaderboardRow user={currentUser} rank={null} highlight />
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
    textAlign: 'center',
    marginVertical: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#333',
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  currentUserHighlight: {
    backgroundColor: '#444',
    borderRadius: 10,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  switchButtonActive: {
    backgroundColor: primaryColor,
  },
  switchText: {
    color: 'white',
    fontWeight: 'bold',
  },
  switchTextActive: {
    color: 'black',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  rank: {
    width: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  medal: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  username: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
  points: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
});

export default LeaderboardScreen;
