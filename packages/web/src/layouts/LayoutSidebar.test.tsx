import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LayoutSidebar from './LayoutSidebar';

// Mock stores
let mockIsSidebarHidden = false;

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    isSidebarHidden: mockIsSidebarHidden
  })
}));

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: () => ({
    chats: [],
    isLoading: false
  })
}));

// Mock SideBar component
vi.mock('@/components/SideBar/SideBar.tsx', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

describe('LayoutSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSidebarHidden = false;
  });

  it('should render children', () => {
    render(
      <LayoutSidebar>
        <div data-testid="test-child">Test Content</div>
      </LayoutSidebar>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render sidebar', () => {
    render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    expect(container.querySelector('.layout-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.layout-sidebar__sidebar')).toBeInTheDocument();
    expect(container.querySelector('.layout-sidebar__main')).toBeInTheDocument();
  });

  it('should hide sidebar when isSidebarHidden is true', () => {
    mockIsSidebarHidden = true;

    const { container } = render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    const sidebar = container.querySelector('.layout-sidebar__sidebar');
    expect(sidebar?.classList.contains('hidden')).toBe(true);
  });

  it('should show sidebar when isSidebarHidden is false', () => {
    mockIsSidebarHidden = false;

    const { container } = render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    const sidebar = container.querySelector('.layout-sidebar__sidebar');
    expect(sidebar?.classList.contains('hidden')).toBe(false);
  });

  it('should setup ResizeObserver on mount', () => {
    const observeSpy = vi.fn();
    global.ResizeObserver = class ResizeObserver {
      observe = observeSpy;
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;

    render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    expect(observeSpy).toHaveBeenCalled();
  });

  it('should cleanup ResizeObserver on unmount', () => {
    const disconnectSpy = vi.fn();
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnectSpy;
    } as any;

    const { unmount } = render(
      <LayoutSidebar>
        <div>Test</div>
      </LayoutSidebar>
    );

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should render multiple children', () => {
    render(
      <LayoutSidebar>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </LayoutSidebar>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});
