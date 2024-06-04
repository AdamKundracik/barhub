import {Alert, Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Layout from "../../components/user/Layout";
import {signOut} from "firebase/auth";
import {auth, functions} from "../../../../firebaseConfig";
import {useTranslation} from "react-i18next";
import 'firebase/functions';
import {useEffect, useState} from "react";
import {httpsCallable} from "firebase/functions";
import {UserRecord} from "../../utils/types/types";

export const Account = ({navigation}: any) => {
    const {t} = useTranslation();

    function triggerSignOut() {
        signOut(auth)
            .then(() => {
                Alert.alert(t("Signed out"), t("You have been signed out"), [
                    {text: "Ok"},
                ]);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const [user, setUser] = useState<UserRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCurrentUser() {
            const getUserFunction = httpsCallable(functions, 'getCurrentUser');

            try {
                const result = await getUserFunction();
                const userData = result.data as UserRecord;
                console.log("Current User: ", userData);
                setUser(userData);
            } catch (error) {
                console.error("Error getting current user: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    return (
        <Layout pageTitle={'Account'}>
            <View style={styles.container}>
                <Image source={{uri: 'rrr'}} style={styles.profilePicture}/>
                <Text style={styles.userName}>{user?.email}</Text>
                <Text style={styles.picturesTaken}>Pictures taken: %PICTURES%</Text>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={triggerSignOut}>
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    userName: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 10,
    },
    picturesTaken: {
        fontSize: 18,
        color: '#fff',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

export default Account;
