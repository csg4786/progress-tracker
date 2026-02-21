import create from 'zustand';

type DailyState = {
  items: any[];
  setItems: (items: any[]) => void;
  addItem: (it: any) => void;
};

export const useDailyStore = create<DailyState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (it) => set((s) => ({ items: [it, ...s.items] }))
}));
