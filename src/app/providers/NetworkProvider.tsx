import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  networkType: string;
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  networkType: 'unknown',
  isLoading: true,
});

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState('unknown');
  const [isLoading, setIsLoading] = useState(true);

  const checkNetworkState = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsConnected(networkState.isConnected ?? false);
      setNetworkType(networkState.type || 'unknown');
    } catch (error) {
      console.error('Error checking network state:', error);
      // On error, assume connected to avoid blocking the app
      setIsConnected(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial network check
    checkNetworkState();

    // Set up network state listener
    const subscription = Network.addNetworkStateListener((networkState) => {
      setIsConnected(networkState.isConnected ?? false);
      setNetworkType(networkState.type || 'unknown');
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Periodic network check for additional reliability
  useEffect(() => {
    const interval = setInterval(() => {
      if (Platform.OS !== 'web') {
        checkNetworkState();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const value: NetworkContextType = {
    isConnected,
    networkType,
    isLoading,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
