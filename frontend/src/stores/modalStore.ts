import create from 'zustand';

type ModalState = {
  openModals: { [key: string]: boolean };
  openModal: (name: string) => void;
  closeModal: (name: string) => void;
  closeAll: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  openModals: {},
  openModal: (name: string) => set((s) => ({ openModals: { ...s.openModals, [name]: true } })),
  closeModal: (name: string) => set((s) => ({ openModals: { ...s.openModals, [name]: false } })),
  closeAll: () => set({ openModals: {} })
}));
