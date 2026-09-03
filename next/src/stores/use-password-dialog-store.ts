"use client";

import { create } from "zustand";

type PasswordDialogStore = {
    open: boolean;
    openPasswordDialog: () => void;
    closePasswordDialog: () => void;
};

export const usePasswordDialogStore = create<PasswordDialogStore>((set) => ({
    open: false,
    openPasswordDialog: () => set({ open: true }),
    closePasswordDialog: () => set({ open: false }),
}));
