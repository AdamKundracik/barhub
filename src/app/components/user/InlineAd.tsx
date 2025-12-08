import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { osName } from 'expo-device';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 2000;
const INITIAL_DELAY = 150;

// Rate limiting constants - prevent too many requests
const MIN_TIME_BETWEEN_REQUESTS = 5000; // 5 seconds minimum between ad requests
const MAX_CONCURRENT_REQUESTS = 2; // Maximum 2 ads loading at the same time

// Global state for rate limiting (shared across all InlineAd instances)
let lastRequestTime = 0;
let activeRequestCount = 0;
const requestQueue: Array<() => void> = [];

// Memoize production ID calculation
const getProductionID = () => {
  if (osName === 'Android') {
    return process.env.EXPO_PUBLIC_ANDROID_ADMOB_BANNER_ID;
  }
  return process.env.EXPO_PUBLIC_IOS_ADMOB_BANNER_ID;
};

const productionID = getProductionID();

// Retryable error patterns - memoized outside component
const RETRYABLE_PATTERNS = [
  'network',
  'timeout',
  'connection',
  'unavailable',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
  'NO_FILL',
] as const;

// Check if error is retryable (pure function, no dependencies)
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = String(error?.message || '');
  const errorCode = String(error?.code || '');
  const combined = `${errorMessage} ${errorCode}`.toLowerCase();
  
  return RETRYABLE_PATTERNS.some(pattern => combined.includes(pattern));
};

// Calculate unit ID (memoized outside component)
const getUnitId = (): string | undefined => {
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  return productionID || undefined;
};

// Rate limiting helper
const canMakeRequest = (): boolean => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // Check time constraint
  if (timeSinceLastRequest < MIN_TIME_BETWEEN_REQUESTS) {
    return false;
  }
  
  // Check concurrent requests constraint
  if (activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
    return false;
  }
  
  return true;
};

// Register active request
const registerRequest = (): boolean => {
  if (!canMakeRequest()) {
    return false;
  }
  
  activeRequestCount++;
  lastRequestTime = Date.now();
  return true;
};

// Unregister active request
const unregisterRequest = () => {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  
  // Process queued requests if any
  if (requestQueue.length > 0 && activeRequestCount < MAX_CONCURRENT_REQUESTS) {
    const nextRequest = requestQueue.shift();
    if (nextRequest) {
      // Small delay to ensure rate limit
      setTimeout(() => {
        if (canMakeRequest()) {
          nextRequest();
        } else {
          requestQueue.push(nextRequest);
        }
      }, 100);
    }
  }
};

const InlineAd: React.FC = () => {
  // Combined state to reduce re-renders
  const [adState, setAdState] = useState<{
    isLoaded: boolean;
    hasError: boolean;
    retryCount: number;
    canLoad: boolean;
  }>({
    isLoaded: false,
    hasError: false,
    retryCount: 0,
    canLoad: false,
  });
  
  const [ready, setReady] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bannerKeyRef = useRef(0);
  const isMountedRef = useRef(true);
  const requestRegisteredRef = useRef(false);

  // Memoize unitId - calculated once
  const unitId = useMemo(() => getUnitId(), []);

  // Early return if no unit ID - before any hooks that depend on it
  if (!unitId) {
    return null;
  }

  // Initialize ready state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setReady(true);
      }
    }, INITIAL_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Check if we can load ad (rate limiting)
  useEffect(() => {
    if (!ready || adState.canLoad || adState.isLoaded || adState.hasError) {
      return;
    }

    const checkAndLoad = () => {
      if (canMakeRequest() && !requestRegisteredRef.current) {
        const registered = registerRequest();
        if (registered) {
          requestRegisteredRef.current = true;
          setAdState(prev => ({ ...prev, canLoad: true }));
        } else {
          // Queue this request
          requestQueue.push(() => {
            if (isMountedRef.current && canMakeRequest()) {
              const registered = registerRequest();
              if (registered) {
                requestRegisteredRef.current = true;
                setAdState(prev => ({ ...prev, canLoad: true }));
              }
            }
          });
        }
      }
    };

    // Small delay to stagger requests
    const timer = setTimeout(checkAndLoad, Math.random() * 500);
    return () => clearTimeout(timer);
  }, [ready, adState.canLoad, adState.isLoaded, adState.hasError]);

  // Validate production ID in production (only once)
  useEffect(() => {
    if (!__DEV__) {
      if (!productionID) {
        console.error(
          `[InlineAd] Production AdMob Banner ID is missing for ${osName}. ` +
          `Please set EXPO_PUBLIC_${osName === 'Android' ? 'ANDROID' : 'IOS'}_ADMOB_BANNER_ID environment variable.`
        );
        setAdState(prev => ({ ...prev, hasError: true }));
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (requestRegisteredRef.current) {
        unregisterRequest();
        requestRegisteredRef.current = false;
      }
    };
  }, []);

  // Handle retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (adState.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.log('[InlineAd] Max retry attempts reached');
      setAdState(prev => ({ ...prev, hasError: true }));
      unregisterRequest();
      requestRegisteredRef.current = false;
      return;
    }

    // Longer delay for retries to respect rate limits
    const delay = BASE_RETRY_DELAY * Math.pow(2, adState.retryCount) + MIN_TIME_BETWEEN_REQUESTS;
    console.log(
      `[InlineAd] Retry ${adState.retryCount + 1}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`
    );

    retryTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // Check if we can retry (rate limiting)
      if (canMakeRequest()) {
        bannerKeyRef.current += 1;
        setAdState(prev => ({
          ...prev,
          retryCount: prev.retryCount + 1,
          hasError: false,
          isLoaded: false,
        }));
      } else {
        // Queue retry
        requestQueue.push(() => {
          if (isMountedRef.current && canMakeRequest()) {
            bannerKeyRef.current += 1;
            setAdState(prev => ({
              ...prev,
              retryCount: prev.retryCount + 1,
              hasError: false,
              isLoaded: false,
            }));
          }
        });
      }
    }, delay);
  }, [adState.retryCount]);

  // Callbacks - stable references
  const handleAdLoaded = useCallback(() => {
    console.log('[InlineAd] Ad loaded successfully');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setAdState({
      isLoaded: true,
      hasError: false,
      retryCount: 0,
      canLoad: true,
    });
    // Don't unregister immediately - keep it registered until unmount
  }, []);

  const handleAdFailedToLoad = useCallback(
    (error: any) => {
      const canRetry = isRetryableError(error) && adState.retryCount < MAX_RETRY_ATTEMPTS;
      
      console.error('[InlineAd] Failed to load ad:', {
        error: error?.message || String(error),
        isRetryable: canRetry,
        retryCount: adState.retryCount,
      });

      if (canRetry) {
        console.log(`[InlineAd] Scheduling retry (${adState.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
        scheduleRetry();
      } else {
        console.log('[InlineAd] Non-retryable error or max retries reached');
        setAdState(prev => ({
          ...prev,
          hasError: true,
          isLoaded: false,
        }));
        unregisterRequest();
        requestRegisteredRef.current = false;
      }
    },
    [adState.retryCount, scheduleRetry]
  );

  // Don't render until ready and allowed to load
  if (!ready || !adState.canLoad) {
    return null;
  }

  return (
    <View style={styles.adContainer}>
      {!adState.isLoaded && !adState.hasError && (
        <ActivityIndicator size="large" color="white" />
      )}

      {!adState.hasError && (
        <BannerAd
          key={bannerKeyRef.current}
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoad}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});

export default React.memo(InlineAd);
