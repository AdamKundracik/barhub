import React, { StyleSheet, Text, View } from "react-native";

export const Loading = () => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>BARUJ</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  text: {
    fontSize: 72,
    textAlign: "center",
    color: "#fff",
  },
});
