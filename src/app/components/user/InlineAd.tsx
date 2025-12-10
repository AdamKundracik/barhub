import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { osName } from 'expo-device';
import { getTimingConfig, getAdRequestOptions } from '../../config/productionAdConfig';
import { simpleAdMetrics } from '../../utils/simpleAdMetrics';

// Get configuration based on environment
const timingConfig = getTimingConfig();
const { 
  INITIAL_DELAY, 
  RETRY_DELAYS, 
  MAX_RETRY_ATTEMPTS,
  MIN_TIME_BETWEEN_REQUESTS,
  MAX_CONCURRENT_REQUESTS 
} = timingConfig;

// Global rate limiting state
let lastRequestTime = 0;
let activeRequestCount = 0;

// Get production AdMob unit ID
const getProductionID = () => {
  if (osName === 'Android') {
    return process.env.EXPO_PUBLIC_ANDROID_ADMOB_BANNER_ID;
  }
  return process.env.EXPO_PUBLIC_IOS_ADMOB_BANNER_ID;
};

// Get appropriate unit ID based on environment
const getUnitId = (): string | undefined => {
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  return getProductionID() || undefined;
};

// Simple rate limiting check
const canMakeRequest = (): boolean => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  return (
    timeSinceLastRequest >= MIN_TIME_BETWEEN_REQUESTS &&
    activeRequestCount < MAX_CONCURRENT_REQUESTS
  );
};

// Register request
const registerRequest = (): boolean => {
  if (!canMakeRequest()) {
    return false;
  }
  
  activeRequestCount++;
  lastRequestTime = Date.now();
  return true;
};

// Unregister request
const unregisterRequest = () => {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
};

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = String(error?.code || '').toLowerCase();
  const combined = `${errorMessage} ${errorCode}`;
  
  // Common retryable patterns
  const retryablePatterns = [
    'network', 'timeout', 'connection', 'unavailable',
    'internal_error', 'network_error', 'no_fill'
  ];
  
  return retryablePatterns.some(pattern => combined.includes(pattern));
};

const InlineAd: React.FC = () => {
  const [adState, setAdState] = useState({
    isLoaded: false,
    hasError: false,
    retryCount: 0,
    isReady: false,
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const requestRegisteredRef = useRef(false);
  const adKeyRef = useRef(0);

  // Get unit ID (memoized)
  const unitId = useMemo(() => getUnitId(), []);

  // Early return if no unit ID
  if (!unitId) {
    if (__DEV__) {
      console.warn('[InlineAd] No unit ID available');
    }
    return null;
  }

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setAdState(prev => ({ ...prev, isReady: true }));
      }
    }, INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, []);

  // Handle ad loading
  useEffect(() => {
    if (!adState.isReady || adState.isLoaded || adState.hasError || requestRegisteredRef.current) {
      return;
    }

    const loadAd = () => {
      if (registerRequest()) {
        requestRegisteredRef.current = true;
        simpleAdMetrics.trackRequest();
      }
    };

    // Small random delay to prevent simultaneous requests
    const delay = Math.random() * 1000;
    const timer = setTimeout(loadAd, delay);

    return () => clearTimeout(timer);
  }, [adState.isReady, adState.isLoaded, adState.hasError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (requestRegisteredRef.current) {
        unregisterRequest();
      }
    };
  }, []);

  // Handle successful ad load
  const handleAdLoaded = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    simpleAdMetrics.trackSuccess();
    
    setAdState({
      isLoaded: true,
      hasError: false,
      retryCount: 0,
      isReady: true,
    });
  }, []);

  // Handle ad load failure with smart retry
  const handleAdFailedToLoad = useCallback((error: any) => {
    const canRetry = isRetryableError(error) && adState.retryCount < MAX_RETRY_ATTEMPTS;
    
    simpleAdMetrics.trackFailure();
    
    if (__DEV__) {
      console.warn('[InlineAd] Failed to load:', error?.message || 'Unknown error');
    }

    if (canRetry) {
      const delay = RETRY_DELAYS[adState.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      
      retryTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        // Reset for retry
        adKeyRef.current += 1;
        requestRegisteredRef.current = false;
        
        setAdState(prev => ({
          ...prev,
          retryCount: prev.retryCount + 1,
          hasError: false,
          isLoaded: false,
        }));
      }, delay);
    } else {
      // Max retries reached or non-retryable error
      setAdState(prev => ({
        ...prev,
        hasError: true,
        isLoaded: false,
      }));
      
      if (requestRegisteredRef.current) {
        unregisterRequest();
        requestRegisteredRef.current = false;
      }
    }
  }, [adState.retryCount]);

  // Don't render until ready
  if (!adState.isReady) {
    return null;
  }

  // Don't render if error and no retries left
  if (adState.hasError) {
    return null;
  }

  return (
    <View style={styles.adContainer}>
      {!adState.isLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      
      <BannerAd
        key={adKeyRef.current}
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={getAdRequestOptions()}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 50,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default React.memo(InlineAd);