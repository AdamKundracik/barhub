import { QueryClient } from 'react-query';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createQueryClientWithPersistence = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1 * 60 * 1000, // 1 minute - data considered fresh for 1 minute
        cacheTime: 15 * 60 * 1000, // 15 minutes - keep in cache for 15 minutes
        refetchInterval: 3 * 60 * 1000, // Automatic refetch every 3 minutes
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
    maxAge: 1000 * 60 * 15, // Cache for 15 minutes (matches cacheTime)
  });

  return queryClient;
};
