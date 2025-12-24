import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

interface LogsStore {
  logs: LogEntry[];
  maxLogs: number;
  isInitialized: boolean;

  // Actions
  addLog: (
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: string) => LogEntry[];
  getRecentLogs: (count?: number) => LogEntry[];
  loadLogs: () => Promise<void>;
}

const STORAGE_KEY = '@barhub_debug_logs';
const generateLogId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useLogsStore = create<LogsStore>()(
  subscribeWithSelector((set, get) => {
    // Helper function to save logs to AsyncStorage
    const saveLogsToStorage = async (logs: LogEntry[]) => {
      try {
        const maxLogs = get().maxLogs;
        const logsToSave = logs.slice(-maxLogs); // Only save last maxLogs entries
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave));
        console.log(`[LogsStore] Saved ${logsToSave.length} logs to AsyncStorage`);
      } catch (error) {
        console.error('[LogsStore] Failed to save logs to AsyncStorage:', error);
      }
    };

    // Load logs immediately on store creation (synchronously if possible)
    let logsLoaded = false;
    let loadedLogs: LogEntry[] = [];
    
    const initialLoadLogs = async () => {
      if (logsLoaded) return;
      logsLoaded = true;
      
      try {
        const storedLogs = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedLogs) {
          const parsedLogs: LogEntry[] = JSON.parse(storedLogs);
          loadedLogs = parsedLogs;
          console.log(`[LogsStore] Loaded ${parsedLogs.length} logs from AsyncStorage`);
          set({ logs: parsedLogs, isInitialized: true });
        } else {
          console.log('[LogsStore] No logs found in AsyncStorage');
          set({ isInitialized: true });
        }
      } catch (error) {
        console.error('[LogsStore] Failed to load logs from AsyncStorage:', error);
        set({ isInitialized: true });
      }
    };

    // Start loading immediately
    initialLoadLogs();
    
    // Initialize with loaded logs if available (will be set async, but prevents empty state)
    const initialState = loadedLogs.length > 0 ? { logs: loadedLogs, isInitialized: false } : { logs: [], isInitialized: false };

    return {
      logs: [],
      maxLogs: 1000, // Keep last 1000 logs

      loadLogs: async () => {
        if (logsLoaded) {
          console.log('[LogsStore] Logs already loaded, skipping');
          return;
        }
        logsLoaded = true;
        
        try {
          const storedLogs = await AsyncStorage.getItem(STORAGE_KEY);
          if (storedLogs) {
            const parsedLogs: LogEntry[] = JSON.parse(storedLogs);
            console.log(`[LogsStore] Loaded ${parsedLogs.length} logs from AsyncStorage`);
            set({ logs: parsedLogs, isInitialized: true });
          } else {
            console.log('[LogsStore] No logs found in AsyncStorage');
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('[LogsStore] Failed to load logs from AsyncStorage:', error);
          set({ isInitialized: true });
        }
      },

      addLog: (
        level: LogLevel,
        category: string,
        message: string,
        data?: any
      ) => {
        const logEntry: LogEntry = {
          id: generateLogId(),
          timestamp: Date.now(),
          level,
          category,
          message,
          data,
        };

        // If logs haven't been loaded yet, load them first (async, but we'll handle it)
        const currentState = get();
        if (!currentState.isInitialized || currentState.logs.length === 0) {
          // Load logs from storage first, then add new log
          AsyncStorage.getItem(STORAGE_KEY)
            .then(storedLogs => {
              if (storedLogs) {
                const parsedLogs: LogEntry[] = JSON.parse(storedLogs);
                set({ logs: parsedLogs, isInitialized: true });
                // Now add the new log
                set(state => {
                  const newLogs = [...state.logs, logEntry];
                  const trimmedLogs =
                    newLogs.length > state.maxLogs
                      ? newLogs.slice(-state.maxLogs)
                      : newLogs;
                  saveLogsToStorage(trimmedLogs).catch(error => {
                    console.error('[LogsStore] Error saving logs:', error);
                  });
                  return { logs: trimmedLogs };
                });
              } else {
                // No stored logs, just add new one
                set(state => {
                  const newLogs = [...state.logs, logEntry];
                  const trimmedLogs =
                    newLogs.length > state.maxLogs
                      ? newLogs.slice(-state.maxLogs)
                      : newLogs;
                  saveLogsToStorage(trimmedLogs).catch(error => {
                    console.error('[LogsStore] Error saving logs:', error);
                  });
                  return { logs: trimmedLogs, isInitialized: true };
                });
              }
            })
            .catch(error => {
              console.error('[LogsStore] Failed to load logs before adding:', error);
              // Add log anyway
              set(state => {
                const newLogs = [...state.logs, logEntry];
                const trimmedLogs =
                  newLogs.length > state.maxLogs
                    ? newLogs.slice(-state.maxLogs)
                    : newLogs;
                saveLogsToStorage(trimmedLogs).catch(err => {
                  console.error('[LogsStore] Error saving logs:', err);
                });
                return { logs: trimmedLogs, isInitialized: true };
              });
            });
          return; // Exit early, log will be added after loading
        }

        // Logs are already loaded, just add new one
        set(state => {
          const newLogs = [...state.logs, logEntry];
          // Keep only last maxLogs entries
          const trimmedLogs =
            newLogs.length > state.maxLogs
              ? newLogs.slice(-state.maxLogs)
              : newLogs;
          
          // Save to AsyncStorage asynchronously (don't await to avoid blocking)
          saveLogsToStorage(trimmedLogs).catch(error => {
            console.error('[LogsStore] Error saving logs:', error);
          });
          
          return { logs: trimmedLogs };
        });

        // Also log to console for immediate debugging
        const consoleMessage = `[${category}] ${message}`;
        const logData = data ? { data } : {};
        switch (level) {
          case 'error':
            console.error(consoleMessage, logData);
            break;
          case 'warn':
            console.warn(consoleMessage, logData);
            break;
          case 'debug':
            if (__DEV__) {
              console.log(consoleMessage, logData);
            }
            break;
          default:
            console.log(consoleMessage, logData);
        }
      },

      clearLogs: async () => {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
          set({ logs: [] });
        } catch (error) {
          console.error('[LogsStore] Failed to clear logs from AsyncStorage:', error);
          set({ logs: [] });
        }
      },

      getLogsByCategory: (category: string) => {
        return get().logs.filter(log => log.category === category);
      },

      getRecentLogs: (count: number = 100) => {
        const logs = get().logs;
        return logs.slice(-count);
      },
    };
  })
);

// Helper functions for easy logging
export const logDebug = (
  category: string,
  message: string,
  data?: any
) => {
  useLogsStore.getState().addLog('debug', category, message, data);
};

export const logInfo = (
  category: string,
  message: string,
  data?: any
) => {
  useLogsStore.getState().addLog('info', category, message, data);
};

export const logWarn = (
  category: string,
  message: string,
  data?: any
) => {
  useLogsStore.getState().addLog('warn', category, message, data);
};

export const logError = (
  category: string,
  message: string,
  data?: any,
  error?: Error
) => {
  useLogsStore.getState().addLog(
    'error',
    category,
    message,
    {
      ...data,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    }
  );
};


