import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { primaryBgColor } from '../../../utils/styles/colors';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';

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
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: primaryBgColor }]}
    >
      <Box style={styles.mainContainer}>
        <Box style={styles.header}>
          <Box style={styles.headerLeft}>
            {clickFunction && (
              <Pressable onPress={clickFunction} style={styles.backButton}>
                <FontAwesomeIcon icon={Icons.Left} size={24} color="white" />
              </Pressable>
            )}
          </Box>

          {showTitle && title && (
            <Center style={styles.headerCenter}>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {title}
              </Text>
            </Center>
          )}

          <Box style={styles.headerRight} />
        </Box>

        <Box style={{ flex: 1 }}>{children}</Box>
      </Box>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
    height: 56,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  headerCenter: { flex: 2, alignItems: 'center' },
  headerRight: { flex: 1 },
  backButton: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
});
