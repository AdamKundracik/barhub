import React from 'react';
import { FlatList, Text, View } from 'react-native';

// import generovaného JSON
import licenses from './../../../../../../licenses.json';
import { ScreenLayout } from '@/src/app/components/user/Shared/ScreenLayout';
import { useNavigation } from '@react-navigation/native';

export default function Licenses() {
  const navigation = useNavigation();
  // Prevedieme objekt na pole pre jednoduchší rendering
  const data = Object.entries(licenses).map(([name, info]: any) => ({
    name,
    license: info.licenses,
    repository: info.repository,
    publisher: info.publisher,
  }));

  return (
    <ScreenLayout title={'Licenses'} clickFunction={() => navigation.goBack()}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlatList
          data={data}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}
              >
                {item.name}
              </Text>
              <Text>License: {item.license}</Text>
              {item.publisher && (
                <Text style={{ color: 'white' }}>Author: {item.publisher}</Text>
              )}
              {item.repository && (
                <Text style={{ color: 'white' }}>Repo: {item.repository}</Text>
              )}
            </View>
          )}
        />
      </View>
    </ScreenLayout>
  );
}
