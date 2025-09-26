import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import Layout from '@/src/app/components/shared/Layouts/Layout';
import { Place } from '../../../utils/types/types';
import { primaryColor, primaryDeepColor } from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchPlacesAPI';
import { useLocationStore } from '@/src/app/utils/store/locationStore';

export const PhotoResolver = ({ route }: any) => {
  const { location } = useLocationStore();
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
      style={{ paddingVertical: 10 }}
      onPress={() => {
        navigation.navigate('PostSummary', { image: image ?? '', place: item });
      }}
    >
      {({ pressed }) => (
        <View>
          <Text
            style={[
              { fontSize: 16, fontWeight: 'bold' },
              pressed ? { color: primaryColor } : { color: 'white' },
            ]}
          >
            {item?.displayName.text}
          </Text>
          <Text
            style={[
              { fontSize: 14 },
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
    <ScreenLayout
      title={t('select-place')}
      onBackPress={navigation.goBack}
      showBackButton
    >
      <FlatList data={places} renderItem={renderItem} />
    </ScreenLayout>
  );
};

export default PhotoResolver;
