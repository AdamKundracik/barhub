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
  showTitle?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export const ScreenLayout = ({
  children,
  title,
  showTitle = false,
  showBackButton = false,
  onBackPress,
}: ScreenLayoutProps) => {
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: primaryBgColor }]}
    >
      <Box style={styles.container}>
        {(showTitle || showBackButton) && (
          <Box style={styles.header}>
            {/* Back button */}
            {showBackButton && onBackPress ? (
              <Pressable onPress={onBackPress} style={styles.backButton}>
                <FontAwesomeIcon
                  icon={Icons.ChevronLeft}
                  size={24}
                  color="white"
                />
              </Pressable>
            ) : (
              showTitle && <Box style={styles.backButtonPlaceholder} />
            )}

            {/* Title */}
            {showTitle && title && (
              <Center
                style={[
                  styles.titleContainer,
                  !showBackButton && styles.titleContainerFullWidth,
                ]}
              >
                <Text numberOfLines={1} style={styles.titleText}>
                  {title}
                </Text>
              </Center>
            )}

            {/* Right placeholder (for symmetry) */}
            {showBackButton && <Box style={styles.rightPlaceholder} />}
          </Box>
        )}

        <Box style={styles.content}>{children}</Box>
      </Box>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    marginBottom: 12,
    position: 'relative',
  },
  backButton: { padding: 8 },
  backButtonPlaceholder: { width: 40 }, // placeholder to keep title centered
  titleContainer: { flex: 1, alignItems: 'center' },
  titleContainerFullWidth: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 28,
    textAlign: 'center',
  },
  rightPlaceholder: { width: 40 }, // for symmetry with back button
  content: { flex: 1 },
});
