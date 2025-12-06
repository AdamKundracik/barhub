import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { commonAppStyles } from '../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../utils/styles/themeColors';

const OrSeparator = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { borderBottomColor: colors.separatorColor }]} />
      <View style={styles.textContainer}>
        <Text style={[commonAppStyles.textSecondary, { color: colors.primaryTextColor }]}>{t('or')}</Text>
      </View>
      <View style={[styles.line, { borderBottomColor: colors.separatorColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    width: 150,
    paddingVertical: 20,
  },
  line: {
    // borderBottomColor is set inline to use theme colors
    borderBottomWidth: 1,
    width: 40,
    alignSelf: 'center',
  },
  textContainer: {
    alignSelf: 'center',
  },
});

export default OrSeparator;
