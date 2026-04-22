import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewChatView from './NewChatView';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

vi.mock('@/components/AuthState/AuthState', () => ({
  default: () => <div data-testid="auth-state">AuthState</div>
}));

vi.mock('@/components/NewChat/NewChat', () => ({
  default: ({ onCreated }: { onCreated: (data: any) => void }) => (
    <div data-testid="new-chat">NewChat</div>
  )
}));

vi.mock('@/components/VersionApp/VersionApp', () => ({
  default: () => <div data-testid="version-app">VersionApp</div>
}));

vi.mock('@/helpers/HelperIframe', () => ({
  isInIframe: false
}));

describe('NewChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <NewChatView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('new-chat')).toBeInTheDocument();
  });

  it('should render AuthState component', () => {
    render(
      <BrowserRouter>
        <NewChatView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-state')).toBeInTheDocument();
  });

  it('should render VersionApp component', () => {
    render(
      <BrowserRouter>
        <NewChatView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('version-app')).toBeInTheDocument();
  });

  it('should have correct layout class', () => {
    const { container } = render(
      <BrowserRouter>
        <NewChatView />
      </BrowserRouter>
    );

    expect(container.querySelector('.main-layout')).toBeInTheDocument();
    expect(container.querySelector('.new-chat-view')).toBeInTheDocument();
  });

  it('should render logo', () => {
    const { container } = render(
      <BrowserRouter>
        <NewChatView />
      </BrowserRouter>
    );

    const logo = container.querySelector('.new-chat-view__logo-img');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('alt', 'logo');
  });
});
