import Layout from "../../components/user/Layout";
import {ActivityIndicator, Alert, FlatList, StyleSheet, View} from "react-native";
import {signOut} from "firebase/auth";
import {getDownloadURL, list, ref} from "firebase/storage";
import {auth, storage} from "../../../../firebaseConfig";
import {useEffect, useState} from "react";
import UserPost from "../../components/user/UserPost";

export const NewsFeed = ({navigation}: any) => {

    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const listFiles = async () => {
            try {
                const storageRef = ref(storage); // Specify your directory path here
                const res = await list(storageRef, {maxResults: 10});
                const urls = await Promise.all(res.items.map((item) => getDownloadURL(item)));
                setFileUrls(urls);
            } catch (error) {
                console.error('Error listing files: ', error);
            } finally {
                setLoading(false);
            }
        };

        listFiles();
    }, []);

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
            {text: "Ok", onPress: () => navigation.navigate("Login")},
        ]);
    };

    return (
        <Layout pageTitle={"Feed"}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff"/>
            ) : (
                <FlatList
                    data={fileUrls}
                    keyExtractor={(item) => item}
                    renderItem={({item}) => <>
                        <View style={{marginVertical: 30}}>
                            <UserPost link={item}/>
                        </View>
                    </>}
                />
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 200,
        marginBottom: 10,
    },
});

export default NewsFeed;
