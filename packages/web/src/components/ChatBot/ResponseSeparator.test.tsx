import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResponseSeparator from './ResponseSeparator';

describe('ResponseSeparator', () => {
  it('should render with default props', () => {
    const { container } = render(<ResponseSeparator />);

    expect(screen.getByText('Tool Response')).toBeInTheDocument();
    expect(container.querySelector('.text-slate-400')).toBeInTheDocument();
  });

  it('should render with custom label for unknown hook type', () => {
    render(<ResponseSeparator hookType="unknown" label="Custom Label" />);

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('should render repository_config_selection hook type', () => {
    render(<ResponseSeparator hookType="repository_config_selection" />);

    expect(screen.getByText('Repository Configuration')).toBeInTheDocument();
  });

  it('should render option_selection hook type', () => {
    render(<ResponseSeparator hookType="option_selection" />);

    expect(screen.getByText('Options')).toBeInTheDocument();
  });

  it('should render canvas_analysis_suggestion hook type', () => {
    render(<ResponseSeparator hookType="canvas_analysis_suggestion" />);

    expect(screen.getByText('Canvas Suggestion')).toBeInTheDocument();
  });

  it('should render code_changes hook type', () => {
    render(<ResponseSeparator hookType="code_changes" />);

    expect(screen.getByText('Code Changes')).toBeInTheDocument();
  });

  it('should render background_task hook type', () => {
    render(<ResponseSeparator hookType="background_task" />);

    expect(screen.getByText('Background Task')).toBeInTheDocument();
  });

  it('should render deployment_options hook type', () => {
    render(<ResponseSeparator hookType="deployment_options" />);

    expect(screen.getByText('Deployment Options')).toBeInTheDocument();
  });

  it('should render entity_config hook type', () => {
    render(<ResponseSeparator hookType="entity_config" />);

    expect(screen.getByText('Entity Configuration')).toBeInTheDocument();
  });

  it('should render workflow_config hook type', () => {
    render(<ResponseSeparator hookType="workflow_config" />);

    expect(screen.getByText('Workflow Configuration')).toBeInTheDocument();
  });

  it('should fallback to custom label for unknown hook type', () => {
    render(<ResponseSeparator hookType="unknown_type" label="Fallback Label" />);

    expect(screen.getByText('Fallback Label')).toBeInTheDocument();
  });

  it('should have gradient lines', () => {
    const { container } = render(<ResponseSeparator />);

    const leftGradient = container.querySelector('.bg-gradient-to-r.from-blue-400\\/0.to-blue-400\\/40');
    const rightGradient = container.querySelector('.bg-gradient-to-l.from-blue-400\\/0.to-blue-400\\/40');

    expect(leftGradient).toBeInTheDocument();
    expect(rightGradient).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    const { container } = render(<ResponseSeparator />);

    const wrapper = container.querySelector('.flex.items-center.space-x-3');
    expect(wrapper).toBeInTheDocument();
  });

  it('should render icon with label', () => {
    const { container } = render(<ResponseSeparator hookType="tool_response" />);

    const labelContainer = container.querySelector('.flex.items-center.gap-1\\.5');
    expect(labelContainer).toBeInTheDocument();
    expect(labelContainer).toHaveClass('text-xs', 'font-medium', 'text-slate-400');
  });
});
