import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { primaryColor } from '../../utils/styles/colors';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const weeklyLeaderboard = [
  {
    userId: 'u1',
    username: 'Peter123',
    profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
    points: 85,
  },
  {
    userId: 'u2',
    username: 'AnnaK',
    profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
    points: 72,
  },
  {
    userId: 'u3',
    username: 'MichalX',
    profilePic: 'https://randomuser.me/api/portraits/men/77.jpg',
    points: 64,
  },
  {
    userId: 'u4',
    username: 'SofiaP',
    profilePic: 'https://randomuser.me/api/portraits/women/15.jpg',
    points: 51,
  },
  {
    userId: 'u5',
    username: 'JanNovak',
    profilePic: 'https://randomuser.me/api/portraits/men/5.jpg',
    points: 39,
  },
  {
    userId: 'u6',
    username: 'Lukas_89',
    profilePic: 'https://randomuser.me/api/portraits/men/12.jpg',
    points: 28,
  },
  {
    userId: 'u7',
    username: 'Katarina',
    profilePic: 'https://randomuser.me/api/portraits/women/9.jpg',
    points: 17,
  },
  {
    userId: 'u8',
    username: 'DavidM',
    profilePic: 'https://randomuser.me/api/portraits/men/81.jpg',
    points: 10,
  },
];

const allTimeLeaderboard = [
  {
    userId: 'u1',
    username: 'Peter123',
    profilePic: 'https://randomuser.me/api/portraits/men/1.jpg',
    points: 120,
  },
  {
    userId: 'u2',
    username: 'AnnaK',
    profilePic: 'https://randomuser.me/api/portraits/women/2.jpg',
    points: 115,
  },
  {
    userId: 'u3',
    username: 'MarekM',
    profilePic: 'https://randomuser.me/api/portraits/men/3.jpg',
    points: 100,
  },
  {
    userId: 'u4',
    username: 'SofiaP',
    profilePic: 'https://randomuser.me/api/portraits/women/4.jpg',
    points: 95,
  },
  {
    userId: 'u5',
    username: 'JanNovak',
    profilePic: 'https://randomuser.me/api/portraits/men/5.jpg',
    points: 90,
  },
];

const medalMap = [
  require('../../../../assets/gold-medal.png'),
  require('../../../../assets/silver-medal.png'),
  require('../../../../assets/bronze-medal.png'),
];

const LeaderboardScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'week' | 'all'>('week');
  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    if (selectedTab === 'week') setUsers(weeklyLeaderboard);
    else setUsers(allTimeLeaderboard);
  }, [selectedTab]);

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

      <View>
        <Text style={styles.title}>🏆 {t('leaderboard.topUsers')}</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.userId}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            {index < 3 ? (
              <Image source={medalMap[index]} style={styles.medal} />
            ) : (
              <Text style={styles.rank}>{index + 1}.</Text>
            )}
            <Image source={{ uri: item.profilePic }} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.points}>{item.points} pts</Text>
          </View>
        )}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
    textAlign: 'center',
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
