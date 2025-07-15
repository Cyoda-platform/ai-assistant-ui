/**
 * Composable for managing dropdown states across multiple nodes
 */

import { ref } from 'vue'

// Global state for managing which dropdown is currently open
const activeDropdownId = ref<string | null>(null)

export function useDropdownManager(nodeId: string) {
  const isOpen = ref(false)

  // Check if this dropdown is the active one
  const isActive = () => activeDropdownId.value === nodeId

  const openDropdown = () => {
    // Close any other open dropdown
    activeDropdownId.value = nodeId
    isOpen.value = true
  }

  const closeDropdown = () => {
    if (activeDropdownId.value === nodeId) {
      activeDropdownId.value = null
    }
    isOpen.value = false
  }

  const toggleDropdown = () => {
    if (isOpen.value) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  // Watch for changes in active dropdown and close this one if another is opened
  const updateState = () => {
    const shouldBeOpen = activeDropdownId.value === nodeId
    if (isOpen.value !== shouldBeOpen) {
      isOpen.value = shouldBeOpen
    }
  }

  // Close dropdown when clicking outside
  const closeOnClickOutside = () => {
    if (activeDropdownId.value === nodeId) {
      closeDropdown()
    }
  }

  return {
    isOpen,
    isActive,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    updateState,
    closeOnClickOutside,
    activeDropdownId
  }
}
