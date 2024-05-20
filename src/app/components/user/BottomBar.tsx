import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const BottomBar = () => {
  return (
    <View style={styles.barWrapper}>
      <TouchableOpacity>
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text>Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barWrapper: {
    flex: 1,
    height: 10,
  },
});

export default BottomBar;
