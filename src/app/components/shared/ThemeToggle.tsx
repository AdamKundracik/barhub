import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useTheme } from '../../utils/hooks/useTheme';
import { useThemeColors } from '../../utils/styles/themeColors';

export const ThemeToggle: React.FC = () => {
  const { toggleMode, isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryBgColor,
          borderColor: colors.separatorColor,
        },
      ]}
      onPress={toggleMode}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesomeIcon
            icon={isDark ? Icons.Cog : Icons.Bolt}
            size={20}
            color={colors.primaryColor}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.primaryTextColor }]}>
            {isDark ? 'Tmavý režim' : 'Svetlý režim'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
            {isDark
              ? 'Aktuálne používate tmavý režim'
              : 'Aktuálne používate svetlý režim'}
          </Text>
        </View>
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: isDark
                ? colors.primaryColor
                : colors.separatorColor,
            },
          ]}
        >
          <View
            style={[
              styles.toggleCircle,
              {
                backgroundColor: '#FFFFFF',
                transform: [{ translateX: isDark ? 20 : 0 }],
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
