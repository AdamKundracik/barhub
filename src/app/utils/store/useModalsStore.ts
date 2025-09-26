import { create } from 'zustand';

interface ModalsState {
  isFilterOpen: boolean;
  isHelpOpen: boolean;
  isInfoOpen: boolean;
  isLogoutConfirmOpen: boolean;

  openFilter: () => void;
  closeFilter: () => void;
  toggleFilter: () => void;

  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;

  openInfo: () => void;
  closeInfo: () => void;
  toggleInfo: () => void;

  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  toggleLogoutConfirm: () => void;
}

export const useModalsStore = create<ModalsState>(set => ({
  isFilterOpen: false,
  isHelpOpen: false,
  isInfoOpen: false,
  isLogoutConfirmOpen: false,

  openFilter: () => set({ isFilterOpen: true }),
  closeFilter: () => set({ isFilterOpen: false }),
  toggleFilter: () => set(state => ({ isFilterOpen: !state.isFilterOpen })),

  openHelp: () => set({ isHelpOpen: true }),
  closeHelp: () => set({ isHelpOpen: false }),
  toggleHelp: () => set(state => ({ isHelpOpen: !state.isHelpOpen })),

  openInfo: () => set({ isInfoOpen: true }),
  closeInfo: () => set({ isInfoOpen: false }),
  toggleInfo: () => set(state => ({ isInfoOpen: !state.isInfoOpen })),

  openLogoutConfirm: () => set({ isLogoutConfirmOpen: true }),
  closeLogoutConfirm: () => set({ isLogoutConfirmOpen: false }),
  toggleLogoutConfirm: () =>
    set(state => ({ isLogoutConfirmOpen: !state.isLogoutConfirmOpen })),
}));
