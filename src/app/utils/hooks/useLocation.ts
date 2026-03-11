import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/locationStore';
import { useUserStore } from '../store/userStore';
import { tokenManager } from '../api/tokenManager';
import { API_CONFIG, ENDPOINTS } from '../../config/api';
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
} from '../backgroundLocationTask';

type Coords = { latitude: number; longitude: number };

async function syncToBackend(userId: string, coords: Coords) {
  try {
    const token = await tokenManager.getAccessToken();
    await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`, {
      method: 'PATCH',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coords),
    });
  } catch (err) {
    console.error('[Location] syncToBackend failed:', err);
  }
}

export function useLocation() {
  const {
    useFakeLocation,
    location,
    setLocation,
    initialized,
    fakeLocation,
    isLocationLoading,
    setIsLocationLoading,
  } = useLocationStore();

  const userId = useUserStore(s => s.userData?.id?.toString());
  const appState = useRef(AppState.currentState);
  const subs = useRef<Array<{ remove: () => void }>>([]);
  const iosSetupDone = useRef(false);

  // ===========================================
  // iOS: Setup BackgroundGeolocation (once)
  // ===========================================
  useEffect(() => {
    if (
      Platform.OS !== 'ios' ||
      !userId ||
      !initialized ||
      iosSetupDone.current
    )
      return;

    const setup = async () => {
      try {
        const token = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();

        subs.current.push(
          BackgroundGeolocation.onLocation(e => {
            if (e.coords && !e.sample) {
              setLocation({
                latitude: e.coords.latitude,
                longitude: e.coords.longitude,
              });
            }
          }),

          BackgroundGeolocation.onMotionChange(e => {
            if (!e.isMoving && e.location?.coords) {
              setLocation({
                latitude: e.location.coords.latitude,
                longitude: e.location.coords.longitude,
              });
            }
          }),

          BackgroundGeolocation.onAuthorization(async event => {
            if (event.success) {
              try {
                const source: any =
                  (event as any).response ?? (event as any).data ?? {};
                const newAccessToken: string | undefined =
                  source.accessToken ?? source.token ?? source.jwt;
                const newRefreshToken: string | undefined = source.refreshToken;

                if (newAccessToken && newRefreshToken) {
                  await tokenManager.setTokens(newAccessToken, newRefreshToken);
                  await BackgroundGeolocation.setConfig({
                    authorization: {
                      strategy: 'JWT',
                      accessToken: newAccessToken,
                      refreshToken: newRefreshToken,
                    },
                  });
                  console.log('[BGGeo] Tokens synced after refresh');
                } else {
                  console.warn('[BGGeo] Auth success but no tokens in payload');
                }
              } catch (err) {
                console.error('[BGGeo] Token sync failed:', err);
              }
            } else {
              console.error('[BGGeo] Auth failure:', (event as any).error);
            }
          }),

          BackgroundGeolocation.onHttp(event => {
            if (!event.success) {
              console.error(
                '[BGGeo] HTTP error:',
                event.status,
                event.responseText
              );
            }
          })
        );

        await BackgroundGeolocation.ready({
          url: `${API_CONFIG.BASE_URL}${ENDPOINTS.USERS.LOCATION(userId)}`,
          method: 'PATCH' as any,
          locationTemplate:
            '{"latitude":<%= latitude %>,"longitude":<%= longitude %>}',
          httpRootProperty: '.',
          autoSync: true,
          desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
          distanceFilter: 20,
          stopTimeout: 5,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          showsBackgroundLocationIndicator: false,
          debug: false,
          headers: { 'Content-Type': 'application/json' },
          logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
          authorization: {
            strategy: 'JWT',
            accessToken: token ?? '',
            refreshToken: refreshToken ?? '',
            refreshUrl: `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
            refreshPayload: { refreshToken: '{refreshToken}' },
            expires: -1,
          },
        });

        iosSetupDone.current = true;
        console.log('[BGGeo] Setup complete');
      } catch (err) {
        console.error('[BGGeo] Setup failed:', err);
      }
    };

    setup();

    return () => {
      subs.current.forEach(s => s.remove());
      subs.current = [];
      iosSetupDone.current = false;
    };
  }, [userId, initialized, setLocation]);

  // ===========================================
  // Toggle: Real vs Fake location
  // ===========================================
  useEffect(() => {
    console.log(
      '[Location] Toggle fired — initialized:',
      initialized,
      '| useFakeLocation:',
      useFakeLocation,
      '| platform:',
      Platform.OS,
      '| userId:',
      userId
    );

    if (!initialized) return;

    const toggle = async () => {
      // --- Fake location ON ---
      if (useFakeLocation) {
        console.log('[Location] Fake location ON — stopping real tracking');
        setIsLocationLoading(false);
        if (Platform.OS === 'ios') {
          await BackgroundGeolocation.stop();
        } else {
          await unregisterBackgroundTask();
        }
        if (fakeLocation) setLocation(fakeLocation);
        return;
      }

      // --- Real tracking ON ---
      console.log('[Location] Real tracking ON');
      setIsLocationLoading(true);

      if (Platform.OS === 'ios') {
        await BackgroundGeolocation.start();
        BackgroundGeolocation.getCurrentPosition({
          samples: 3,
          persist: true,
          timeout: 15,
        })
          .then(loc => {
            console.log(
              '[BGGeo] Got initial position:',
              loc.coords.latitude,
              loc.coords.longitude
            );
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          })
          .catch(err =>
            console.error('[BGGeo] getCurrentPosition failed:', err)
          )
          .finally(() => setIsLocationLoading(false));
      } else {
        // Android
        try {
          console.log('[Location] Requesting foreground permission...');
          const { status: fgStatus } =
            await Location.requestForegroundPermissionsAsync();
          console.log('[Location] Foreground permission:', fgStatus);
          if (fgStatus !== 'granted') {
            console.warn('[Location] Foreground permission denied');
            setIsLocationLoading(false);
            return;
          }

          console.log('[Location] Requesting background permission...');
          const { status: bgStatus } =
            await Location.requestBackgroundPermissionsAsync();
          console.log('[Location] Background permission:', bgStatus);
          if (bgStatus !== 'granted') {
            console.warn(
              '[Location] Background permission denied — foreground only'
            );
          }

          console.log('[Location] Getting current position...');
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          console.log(
            '[Location] Got coords:',
            coords.latitude,
            coords.longitude
          );

          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });

          if (userId) {
            await syncToBackend(userId, {
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }

          console.log('[Location] Registering background task...');
          await registerBackgroundTask();
          console.log('[Location] Background task registered successfully');
        } catch (err) {
          console.error('[Location] Android setup failed:', err);
        } finally {
          setIsLocationLoading(false);
        }
      }
    };

    toggle();
  }, [
    useFakeLocation,
    fakeLocation,
    initialized,
    userId,
    setLocation,
    setIsLocationLoading,
  ]);

  // ===========================================
  // Foreground refresh on app resume
  // ===========================================
  useEffect(() => {
    const handler = async (next: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;

      if (!wasBackground || next !== 'active' || useFakeLocation) return;

      console.log('[Location] App resumed — refreshing location');
      setIsLocationLoading(true);

      if (Platform.OS === 'ios') {
        BackgroundGeolocation.getCurrentPosition({
          samples: 3,
          persist: true,
          timeout: 30,
        })
          .then(loc => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          })
          .catch(err =>
            console.error('[BGGeo] Resume getCurrentPosition failed:', err)
          )
          .finally(() => setIsLocationLoading(false));
      } else {
        try {
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          if (userId) {
            syncToBackend(userId, {
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }
        } catch (err) {
          console.error('[Location] Resume refresh failed:', err);
        } finally {
          setIsLocationLoading(false);
        }
      }
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [useFakeLocation, userId, setLocation, setIsLocationLoading]);

  return { location, useFakeLocation, isLocationLoading };
}
