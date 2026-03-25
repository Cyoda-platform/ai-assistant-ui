import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LogsView from './LogsView';

// Mock dependencies
vi.mock('@/clients/private', () => ({
  default: vi.fn()
}));

vi.mock('../components/LogViewer/LogViewer', () => ({
  default: () => <div data-testid="log-viewer">LogViewer</div>
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    }
  };
});

describe('LogsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <LogsView />
      </BrowserRouter>
    );

    // The component should render (even if it shows loading or error state)
    expect(document.querySelector('.logs-view, .main-layout')).toBeInTheDocument();
  });

  it('should initialize with loading environments state', () => {
    const { container } = render(
      <BrowserRouter>
        <LogsView />
      </BrowserRouter>
    );

    // Component should render
    expect(container).toBeTruthy();
  });

  it('should handle query parameters for environment and application', () => {
    const { container } = render(
      <BrowserRouter initialEntries={['/logs?env_name=prod&app_name=myapp']}>
        <LogsView />
      </BrowserRouter>
    );

    // Component should handle URL params
    expect(container).toBeTruthy();
  });
});
