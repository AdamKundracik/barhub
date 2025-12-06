import React from 'react';
import { useThemeStore } from '../utils/store/themeStore';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { mode } = useThemeStore();

  // Zustand persist will use the default value ('dark') until hydrated,
  // then automatically switch to the stored value if different
  return (
    <GluestackUIProvider mode={mode}>
      {children}
    </GluestackUIProvider>
  );
};
