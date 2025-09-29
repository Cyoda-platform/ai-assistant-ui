/**
 * Hook for managing dropdown states across multiple nodes
 */

import { useState, useCallback, useEffect } from 'react'

// Global state for active dropdown
let globalActiveDropdownId: string | null = null;
const dropdownListeners: Set<() => void> = new Set();

const notifyListeners = () => {
  dropdownListeners.forEach(listener => listener());
};

export function useDropdownManager(nodeId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(globalActiveDropdownId);

  // Subscribe to global dropdown state changes
  useEffect(() => {
    const listener = () => {
      setActiveDropdownId(globalActiveDropdownId);
      setIsOpen(globalActiveDropdownId === nodeId);
    };

    dropdownListeners.add(listener);
    return () => {
      dropdownListeners.delete(listener);
    };
  }, [nodeId]);

  const isActive = useCallback(() => {
    return activeDropdownId === nodeId;
  }, [activeDropdownId, nodeId]);

  const openDropdown = useCallback(() => {
    globalActiveDropdownId = nodeId;
    setIsOpen(true);
    notifyListeners();
  }, [nodeId]);

  const closeDropdown = useCallback(() => {
    if (globalActiveDropdownId === nodeId) {
      globalActiveDropdownId = null;
    }
    setIsOpen(false);
    notifyListeners();
  }, [nodeId]);

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, closeDropdown, openDropdown]);

  const updateState = useCallback(() => {
    const shouldBeOpen = globalActiveDropdownId === nodeId;
    if (isOpen !== shouldBeOpen) {
      setIsOpen(shouldBeOpen);
    }
  }, [isOpen, nodeId]);

  const closeOnClickOutside = useCallback(() => {
    if (globalActiveDropdownId === nodeId) {
      closeDropdown();
    }
  }, [nodeId, closeDropdown]);

  return {
    isOpen,
    isActive,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    updateState,
    closeOnClickOutside,
    activeDropdownId
  };
}
