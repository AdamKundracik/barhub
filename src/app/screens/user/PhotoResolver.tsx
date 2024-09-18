import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { fetchNearbyPlaces } from '../../utils/helper-functions/fetchNearByPlaces';
import { Place } from '../../utils/types/types';
import { PlaceDetail } from '../../components/user/Search/PlaceDetail';
import { useUserContext } from '../../providers/UserProvider';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

export const PhotoResolver = ({ route }: any) => {
  const { location } = useUserContext();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [detailOpened, setDetailOpened] = useState(false);
  const routeParams = route.params as { image?: string }; // Define route params
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (routeParams?.image) {
      setImage(routeParams.image); // Set the place when passed from PlaceSearch
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

  const renderItem = ({ item, index }: { item: Place; index: number }) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        {
          padding: pressed ? 16 : 16,
        },
      ]}
      onPress={() => {
        setSelectedPlace(item);
        setDetailOpened(true);
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
    <Layout pageTitle={'PhotoResolver'} isBackButtonShown={true}>
      <View
        style={{
          padding: 20,
          alignItems: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
          {t('select-place')}
        </Text>
        <View />
      </View>
      <FlatList data={places} renderItem={renderItem} />
      <PlaceDetail
        image={image}
        isOpen={detailOpened}
        onClose={() => setDetailOpened(false)}
        place={selectedPlace}
      />
    </Layout>
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
});

export default PhotoResolver;
