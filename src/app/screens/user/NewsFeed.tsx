import Layout from "../../components/user/Layout";
import {ActivityIndicator, StyleSheet, View} from "react-native";
import {getDownloadURL, list, ref} from "firebase/storage";
import {storage} from "../../../../firebaseConfig";
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

    return (
        <Layout pageTitle={"Feed"}>
            {loading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color="#ffffff"/>
                </View>
            ) : (
                fileUrls.map((link) => <UserPost link={link}/>)
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
