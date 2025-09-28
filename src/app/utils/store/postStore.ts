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
}

export const usePostsStore = create<PlaceState>()((set, get) => ({
  posts: null,
  setPosts: (posts: Post[] | null) => set({ posts }),

  listRef: null,
  setListRef: ref => set({ listRef: ref }),

  scrollOnTop: () => {
    const ref = get().listRef;
    if (ref?.current) {
      // FlashList also has scrollToOffset
      ref.current.scrollToOffset?.({
        offset: 0,
        animated: true,
      });
    }
  },
}));
