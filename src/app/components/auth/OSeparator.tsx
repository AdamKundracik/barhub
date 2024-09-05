import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { commonAppStyles } from '../../utils/styles/styles';

const OrSeparator = () => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.textContainer}>
        <Text style={commonAppStyles.textSecondary}>or</Text>
      </View>
      <View style={styles.line} />
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
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    width: 40,
    alignSelf: 'center',
  },
  textContainer: {
    alignSelf: 'center',
  },
});

export default OrSeparator;
