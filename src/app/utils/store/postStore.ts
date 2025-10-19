import { create } from 'zustand/react';
import { RefObject } from 'react';
import { Post } from '@/shared';
import { FlashListRef } from '@shopify/flash-list';

export interface PlaceState {
  posts: Post[] | null;
  setPosts: (posts: Post[] | null) => void;

  listRef: RefObject<FlashListRef<any> | null> | null;
  setListRef: (ref: RefObject<FlashListRef<any> | null> | null) => void;
  scrollOnTop: () => void;
  isScrolling: boolean;
}

let scrollTimeout: NodeJS.Timeout | null = null;

export const usePostsStore = create<PlaceState>()((set, get) => ({
  posts: null,
  setPosts: (posts: Post[] | null) => set({ posts }),

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
      
      // Scroll to top instantly to prevent interrupted animations
      ref.current.scrollToOffset?.({
        offset: 0,
        animated: false, // Changed to false for instant scroll
      });
      
      // Reset isScrolling flag after a short delay
      scrollTimeout = setTimeout(() => {
        set({ isScrolling: false });
      }, 100);
    }
  },
}));
