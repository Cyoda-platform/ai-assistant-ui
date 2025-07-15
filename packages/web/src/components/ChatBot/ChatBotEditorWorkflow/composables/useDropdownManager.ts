/**
 * Composable for managing dropdown states across multiple nodes
 */

import { ref } from 'vue'

const activeDropdownId = ref<string | null>(null)

export function useDropdownManager(nodeId: string) {
  const isOpen = ref(false)

  const isActive = () => activeDropdownId.value === nodeId

  const openDropdown = () => {
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

  const updateState = () => {
    const shouldBeOpen = activeDropdownId.value === nodeId
    if (isOpen.value !== shouldBeOpen) {
      isOpen.value = shouldBeOpen
    }
  }

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
