import Layout from '../../components/user/Layout';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { getDownloadURL, getStorage, list, ref } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import UserPost from '../../components/user/UserPost';
import ActionsRow from '../../components/user/ActionsRow';
import { auth } from '../../../../firebaseConfig';

export const NewsFeed = () => {
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);

  const listFiles = async () => {
    try {
      const storage = getStorage();
      const listRef = ref(storage, auth.currentUser?.uid);
      const res = await list(listRef, { maxResults: 20 });
      const urls = await Promise.all(
        res.items.map(item => getDownloadURL(item)).reverse()
      );
      setFileUrls(urls);
    } catch (error) {
      console.error('Error listing files: ', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setLoading(true);
    listFiles();
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    listFiles();
  }, []);

  return (
    <Layout pageTitle={'Feed'}>
      <ActionsRow />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          fileUrls.map(url => (
            <View
              key={url}
              style={{ marginVertical: 10, zIndex: zoomedPost === url ? 1 : 0 }}
            >
              <UserPost
                link={url}
                setZoomedPost={setZoomedPost}
                isZoomed={zoomedPost === url}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionsRow: {
    height: 30,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  scrollView: {
    flexGrow: 1,
  },
});

export default NewsFeed;
