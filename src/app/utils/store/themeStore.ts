import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const DEFAULT_THEME: ThemeMode = 'dark';

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: DEFAULT_THEME,
      setMode: (mode: ThemeMode) => set({ mode }),
      toggleMode: () =>
        set(state => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
