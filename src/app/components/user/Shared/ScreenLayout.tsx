import React, { ReactNode } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { primaryBgColor } from '../../../utils/styles/colors';

type ScreenLayoutProps = {
  children: ReactNode;
  title?: string;
  clickFunction?: () => void;
  showTitle?: boolean;
};

export const ScreenLayout = ({
  children,
  title,
  clickFunction,
  showTitle = true,
}: ScreenLayoutProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={clickFunction} style={styles.backButton}>
              <FontAwesomeIcon icon={Icons.Left} size={24} color={'white'} />
            </TouchableOpacity>
          </View>

          {showTitle && title && (
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
          )}

          <View style={styles.headerRight} />
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    height: 56,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
