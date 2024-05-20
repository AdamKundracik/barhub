import Layout from "../../components/user/Layout";
import {Alert, Text, TouchableOpacity, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";
import {getAuth, signOut} from "firebase/auth";

export const NewsFeed = ({navigation}: any) => {
    function triggerSignOut() {
        const auth = getAuth();
        signOut(auth)
            .then(() => {
                console.log("signed out");
                triggerSignOutdAlert()
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const triggerSignOutdAlert = () => {
        Alert.alert("Signed out", "You have been signed out", [
            {text: "Ok", onPress: () => navigation.navigate("Login")},
        ]);
    };

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
