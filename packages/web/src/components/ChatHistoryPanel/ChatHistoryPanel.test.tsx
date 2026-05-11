import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatHistoryPanel from './ChatHistoryPanel';

const testState = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => testState.navigateMock,
}));

vi.mock('@/components/LoadingSpinner/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock('@/components/ResizeHandle/ResizeHandle', () => ({
  default: () => <div data-testid="resize-handle" />,
}));

vi.mock('./ChatContextMenu', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ChatBot/ChatBotRenameDialog', () => ({
  default: () => null,
}));

describe('ChatHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to home with focusInput when New Chat is clicked', () => {
    render(
      <ChatHistoryPanel
        chatGroups={[]}
        onResizeMouseDown={vi.fn()}
        isResizing={false}
      />
    );

    fireEvent.click(screen.getByText('New Chat'));

    expect(testState.navigateMock).toHaveBeenCalledWith('/?focusInput=true');
  });
});