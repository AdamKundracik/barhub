import { QueryClient } from 'react-query';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createQueryClientWithPersistence = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        cacheTime: 15 * 60 * 1000, // 15 minutes
        refetchInterval: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  // Create an AsyncStorage persistor
  const asyncStoragePersistor = createAsyncStoragePersistor({
    storage: AsyncStorage,
  });

  // Persist the query client with AsyncStorage
  persistQueryClient({
    queryClient,
    persistor: asyncStoragePersistor,
    maxAge: 1000 * 60 * 15, // Cache for 15 minutes
  });

  return queryClient;
};
