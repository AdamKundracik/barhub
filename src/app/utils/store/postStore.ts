import { create } from 'zustand/react';
import { RefObject } from 'react';
import { FlatList } from 'react-native';
import { Post } from '@/shared';

export interface PlaceState {
  posts: Post[] | null;
  setPosts: (posts: Post[] | null) => void;

  // Allow null in the RefObject generic type
  listRef: RefObject<FlatList<any> | null> | null;
  setListRef: (ref: RefObject<FlatList<any> | null> | null) => void;
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
      // Check if scrollToOffset exists
      if ('scrollToOffset' in ref.current) {
        (ref.current as FlatList<any>).scrollToOffset({
          offset: 0,
          animated: true,
        });
      }
    }
  },
}));
