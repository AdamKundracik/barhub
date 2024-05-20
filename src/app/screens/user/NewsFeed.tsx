import Layout from "../../components/user/Layout";
import { Text, TouchableOpacity, View } from "react-native";
import { commonAppStyles } from "../../utils/styles";
import { getAuth, signOut } from "firebase/auth";

export const NewsFeed = ({ navigation }: any) => {
  function triggerSignOut() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("signed out");
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <Layout pageTitle={"Feed"}>
      <View>
        <Text style={commonAppStyles.textPrimary}>Hello wrld!</Text>
      </View>
      <TouchableOpacity onPress={triggerSignOut}>
        <Text style={commonAppStyles.textPrimary}>Log out</Text>
      </TouchableOpacity>
    </Layout>
  );
};

export default NewsFeed;
