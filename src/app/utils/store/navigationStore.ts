import { create } from 'zustand';

interface NavigationState {
  previousPage: string | null;
  setPreviousPage: (page: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  previousPage: null,
  setPreviousPage: (page: string | null) => set({ previousPage: page }),
}));
