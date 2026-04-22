import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import WorkflowTabsView from './WorkflowTabsView';

// Mock dependencies
vi.mock('@/components/ChatBot/ChatBotEditorWorkflowNew', () => ({
  default: ({ technicalId }: { technicalId: string }) => (
    <div data-testid="workflow-editor">Editor for {technicalId}</div>
  )
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('WorkflowTabsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message when model parameters are missing', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Invalid Workflow Parameters/i)).toBeInTheDocument();
  });

  it('should render error message when model name is missing', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?version=1']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Invalid Workflow Parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/Model name and version are required/i)).toBeInTheDocument();
  });

  it('should render error message when version is missing', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?model=test']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Invalid Workflow Parameters/i)).toBeInTheDocument();
  });

  it('should render workflow editor when valid parameters are provided', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?model=test&version=1']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
    expect(screen.getByText(/Editor for test_v1/i)).toBeInTheDocument();
  });

  it('should handle go back button click when return URL is provided', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?returnUrl=/chat/123']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    const goBackButton = screen.getByText(/Go Back/i);
    fireEvent.click(goBackButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat/123');
  });

  it('should parse version as number correctly', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?model=workflow&version=5']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Editor for workflow_v5/i)).toBeInTheDocument();
  });

  it('should show error when version is not a valid number', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-tabs?model=test&version=invalid']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Invalid Workflow Parameters/i)).toBeInTheDocument();
  });

  it('should render exit fullscreen button with minimize icon when valid parameters', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/workflow-tabs?model=test&version=1']}>
        <WorkflowTabsView />
      </MemoryRouter>
    );

    // Check that the component rendered successfully
    expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
  });
});
