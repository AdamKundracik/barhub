import { PlaceDetail } from '../types/types';
import { create } from 'zustand/react';
import { InfinityScrollPost, Post } from '../../../../shared';
import { QueryObserverResult, InfiniteData } from 'react-query'; // Ensure this is imported

export interface PlaceState {
  posts: Post[] | null;
  setPosts: (posts: Post[] | null) => void;
}

export const usePostsStore = create<PlaceState>()(set => ({
  posts: null,
  setPosts: (posts: Post[] | null) => set({ posts }),
}));
