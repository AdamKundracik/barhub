import { QueryClient } from 'react-query';
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createQueryClientWithPersistence = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds - shorter stale time for fresher data
        cacheTime: 5 * 60 * 1000, // 5 minutes - shorter cache time
        refetchInterval: false, // Disable automatic refetch to prevent conflicts
        refetchOnWindowFocus: false,
        refetchOnReconnect: true, // Refetch when network reconnects
        refetchOnMount: true, // Always refetch on mount for fresh data
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
