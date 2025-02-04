import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Layout from '../../../components/user/Shared/Layout';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchNearByPlaces';
import { Place } from '../../../utils/types/types';
import { useUserContext } from '../../../providers/UserProvider';
import { primaryColor, primaryDeepColor } from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';

export const PhotoResolver = ({ route }: any) => {
  const { location } = useUserContext();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>();
  const routeParams = route.params as { image?: string };
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (routeParams?.image) {
      setImage(routeParams.image);
    }
  }, [routeParams?.image]);

  useEffect(() => {
    async function getPlaces() {
      if (location) {
        const data = await fetchNearbyPlaces(location);
        setLoading(false);
        setPlaces(data.places);
      } else {
        setLoading(false);
        console.error('Location could not be retrieved');
      }
    }
    getPlaces();
  }, []);

  const renderItem = ({ item }: { item: Place; index: number }) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        {
          padding: pressed ? 16 : 16,
        },
      ]}
      onPress={() => {
        navigation.navigate('PostSummary', { image: image ?? '', place: item });
      }}
    >
      {({ pressed }) => (
        <View>
          <Text
            style={[
              { fontSize: 14, fontWeight: 'bold' },
              pressed ? { color: primaryColor } : { color: 'white' },
            ]}
          >
            {item?.displayName.text}
          </Text>
          <Text
            style={[
              { fontSize: 12 },
              pressed ? { color: primaryDeepColor } : { color: 'grey' },
            ]}
          >
            {item.formattedAddress}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <Layout pageTitle={'izi'}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size={32} />
        </View>
      </Layout>
    );
  }

  return (
    <ScreenLayout title={t('select-place')} clickFunction={navigation.goBack}>
      <FlatList data={places} renderItem={renderItem} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'grey',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});

export default PhotoResolver;
