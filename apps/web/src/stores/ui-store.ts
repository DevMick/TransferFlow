import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  collapsed: boolean;
  toggleTheme: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

/**
 * Small client-side UI store (theme + sidebar). Server state lives in TanStack
 * Query; Zustand is reserved for local UI concerns like this.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      collapsed: false,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: 'transferflow-ui' },
  ),
);
