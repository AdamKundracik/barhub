import { create } from 'zustand/react';
import { RefObject } from 'react';
import { FlashListRef } from '@shopify/flash-list';

export interface LeaderboardState {
  listRef: RefObject<FlashListRef<any> | null> | null;
  setListRef: (ref: RefObject<FlashListRef<any> | null> | null) => void;
  scrollOnTop: () => void;
  isScrolling: boolean;
}

let scrollTimeout: NodeJS.Timeout | null = null;

export const useLeaderboardStore = create<LeaderboardState>()((set, get) => ({
  listRef: null,
  setListRef: ref => set({ listRef: ref }),
  
  isScrolling: false,

  scrollOnTop: () => {
    const state = get();
    
    // Prevent multiple simultaneous scroll calls
    if (state.isScrolling) {
      return;
    }
    
    const ref = state.listRef;
    if (ref?.current) {
      set({ isScrolling: true });
      
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Scroll to top with animation
      ref.current.scrollToOffset?.({
        offset: 0,
        animated: true,
      });
      
      // Reset isScrolling flag after a short delay
      scrollTimeout = setTimeout(() => {
        set({ isScrolling: false });
      }, 300);
    }
  },
}));
