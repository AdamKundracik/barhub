import {Alert, Text, TouchableOpacity, View} from "react-native";
import Layout from "../../components/user/Layout";
import {commonAppStyles} from "../../utils/styles/styles";
import {signOut} from "firebase/auth";
import {auth} from "../../../../firebaseConfig";

export const Account = ({navigation}: any) => {
    function triggerSignOut() {
        signOut(auth)
            .then(() => {
                console.log("signed out");
                triggerSignOutAlert();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const triggerSignOutAlert = () => {
        Alert.alert("Signed out", "You have been signed out", [
            {text: "Ok"},
        ]);
    };

    return (
        <Layout pageTitle={'Account'}>
            <View>
                <Text style={commonAppStyles.textPrimary}>Hello wrld</Text>
                <TouchableOpacity onPress={triggerSignOut}><Text style={commonAppStyles.textPrimary}>Sign
                    Out</Text></TouchableOpacity>
            </View>
        </Layout>

    );
};

export default Account;
