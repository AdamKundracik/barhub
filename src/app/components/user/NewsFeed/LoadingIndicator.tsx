import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const LoadingIndicator: React.FC = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <ActivityIndicator size="large" color="#ffffff" />
  </View>
);

export default LoadingIndicator;
