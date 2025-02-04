import { create } from 'zustand/react';
import { Post } from '../../../../shared';

export interface PlaceState {
  posts: Post[] | null;
  setPosts: (posts: Post[] | null) => void;
}

export const usePostsStore = create<PlaceState>()(set => ({
  posts: null,
  setPosts: (posts: Post[] | null) => set({ posts }),
}));
