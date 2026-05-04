"use client";

import { useState } from "react";

export function useMobileMenu(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue);

  return {
    isOpen,
    openMenu: () => setIsOpen(true),
    closeMenu: () => setIsOpen(false),
    toggleMenu: () => setIsOpen((value) => !value),
  };
}
