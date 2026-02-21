import create from 'zustand';

type ThemeState = {
  isDark: boolean;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof localStorage !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false,
  toggle: () => {
    set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      if (typeof document !== 'undefined') {
        if (newIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDark: newIsDark };
    });
  }
}));
