import React, { StyleSheet, Text, View } from 'react-native';

export const Loading = () => {
  return (
    <View style={styles.wrapper}>
      <View style={{ alignSelf: 'center', flexDirection: 'row' }}>
        <View style={{ paddingHorizontal: 5 }}>
          <Text style={[styles.text, { color: 'white' }]}>Bar</Text>
        </View>
        <View
          style={{
            backgroundColor: '#ffa31a',
            borderRadius: 5,
          }}
        >
          <Text style={[styles.text, { color: 'black' }]}>hub</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  text: {
    fontSize: 72,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
});
