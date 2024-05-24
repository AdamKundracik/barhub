import Layout from "../../components/user/Layout";
import {ActivityIndicator, FlatList, StyleSheet, View} from "react-native";
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
