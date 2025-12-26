import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ThemeState,
  PermissionModeState,
  ThinkingModeState,
  UIState,
  UIActions,
} from '@/types';

type UIStoreState = ThemeState &
  PermissionModeState &
  ThinkingModeState &
  Pick<UIState, 'sidebarOpen' | 'currentView'> &
  Pick<UIActions, 'setSidebarOpen' | 'setCurrentView'>;

// Determine initial sidebar state based on screen width
// Desktop (>=768px): open, Mobile (<768px): closed
const getInitialSidebarState = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768;
};

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      // Permission Mode
      permissionMode: 'auto',
      setPermissionMode: (mode) => set({ permissionMode: mode }),

      // Thinking Mode
      thinkingMode: null,
      setThinkingMode: (mode) => set({ thinkingMode: mode }),

      // UI State
      sidebarOpen: getInitialSidebarState(),
      currentView: 'agent',
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        permissionMode: state.permissionMode,
        thinkingMode: state.thinkingMode,
        // sidebarOpen NOT persisted - always use screen-width default
        currentView: state.currentView,
      }),
      // Explicitly ignore any old persisted sidebarOpen value
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<UIStoreState> | undefined;
        return {
          ...current,
          ...persistedState,
          // Always use screen-width-based value, never persisted value
          sidebarOpen: getInitialSidebarState(),
        };
      },
    },
  ),
);
