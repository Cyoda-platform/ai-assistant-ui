import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardView from './DashboardView';

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

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up body class
    document.body.classList.remove('body-dashboard-view');
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Build a fun 'Purrfect Pets' API app with Petstore/i)).toBeInTheDocument();
  });

  it('should add body class on mount', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(document.body.classList.contains('body-dashboard-view')).toBe(true);
  });

  it('should remove body class on unmount', () => {
    const { unmount } = render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    unmount();
    expect(document.body.classList.contains('body-dashboard-view')).toBe(false);
  });

  it('should render progress status indicator', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it('should render project description', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Creating a comprehensive pet management system/i)).toBeInTheDocument();
  });

  it('should render API integration card', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/API Integration Complete/i)).toBeInTheDocument();
  });

  it('should render learn more section', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Learn More/i)).toBeInTheDocument();
    expect(screen.getByText(/What's an Entity Database?/i)).toBeInTheDocument();
  });

  it('should render prototype development card', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Prototype Development/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready in ~10 minutes/i)).toBeInTheDocument();
  });

  it('should render recent updates section', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Recent Updates/i)).toBeInTheDocument();
  });

  it('should render notification items', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Processor Enhancement Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Step Available/i)).toBeInTheDocument();
  });

  it('should render hidden legacy components', () => {
    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-state')).toBeInTheDocument();
    expect(screen.getByTestId('new-chat')).toBeInTheDocument();
  });
});
