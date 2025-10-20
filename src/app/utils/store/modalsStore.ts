import { create } from 'zustand';
import { OccupancyEnum } from '../types/Feed/PostTypes';

interface ModalsState {
  isFilterOpen: boolean;
  isHelpOpen: boolean;
  isInfoOpen: boolean;
  isLogoutConfirmOpen: boolean;
  isCustomReasonOpen: boolean;
  isOccupancyOpen: boolean;
  occupancyValue: OccupancyEnum | null;
  occupancyCallback: ((value: OccupancyEnum) => void) | null;

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

  openCustomReason: () => void;
  closeCustomReason: () => void;
  toggleCustomReason: () => void;

  openOccupancy: (initialValue?: OccupancyEnum | null, callback?: (value: OccupancyEnum) => void) => void;
  closeOccupancy: () => void;
  setOccupancyValue: (value: OccupancyEnum | null) => void;
}

export const modalsStore = create<ModalsState>(set => ({
  isFilterOpen: false,
  isHelpOpen: false,
  isInfoOpen: false,
  isLogoutConfirmOpen: false,
  isCustomReasonOpen: false,
  isOccupancyOpen: false,
  occupancyValue: null,
  occupancyCallback: null,

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

  openCustomReason: () => set({ isCustomReasonOpen: true }),
  closeCustomReason: () => set({ isCustomReasonOpen: false }),
  toggleCustomReason: () =>
    set(state => ({ isCustomReasonOpen: !state.isCustomReasonOpen })),

  openOccupancy: (initialValue, callback) =>
    set({
      isOccupancyOpen: true,
      occupancyValue: initialValue || null,
      occupancyCallback: callback || null,
    }),
  closeOccupancy: () =>
    set({
      isOccupancyOpen: false,
      occupancyValue: null,
      occupancyCallback: null,
    }),
  setOccupancyValue: (value) => set({ occupancyValue: value }),
}));
