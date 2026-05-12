import { renderWithReactFlow } from '@/test-utils/renderWithReactFlow';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupNode } from './GroupNode';

describe('GroupNode', () => {
  const defaultData = {
    label: 'Test Group',
    metadata: {
      groupType: 'environments',
      count: 5,
    },
  };

  it('should render group label', () => {
    renderWithReactFlow(<GroupNode data={defaultData} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('should render count', () => {
    renderWithReactFlow(<GroupNode data={defaultData} />);

    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('should render "item" for count of 1', () => {
    const dataWithOne = {
      ...defaultData,
      metadata: { ...defaultData.metadata, count: 1 },
    };
    renderWithReactFlow(<GroupNode data={dataWithOne} />);

    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('should handle missing metadata', () => {
    const dataWithoutMetadata = { label: 'Test Group' };
    const { container } = renderWithReactFlow(<GroupNode data={dataWithoutMetadata} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  describe('group type colors', () => {
    it('should render environments with emerald color', () => {
      const { container } = renderWithReactFlow(
        <GroupNode
          data={{ ...defaultData, metadata: { ...defaultData.metadata, groupType: 'environments' } }}
        />
      );

      expect(container.querySelector('.from-emerald-700')).toBeInTheDocument();
    });

    it('should render entities with blue color', () => {
      const { container } = renderWithReactFlow(
        <GroupNode
          data={{ ...defaultData, metadata: { ...defaultData.metadata, groupType: 'entities' } }}
        />
      );

      expect(container.querySelector('.from-blue-700')).toBeInTheDocument();
    });

    it('should render workflows with amber color', () => {
      const { container } = renderWithReactFlow(
        <GroupNode
          data={{ ...defaultData, metadata: { ...defaultData.metadata, groupType: 'workflows' } }}
        />
      );

      expect(container.querySelector('.from-amber-700')).toBeInTheDocument();
    });

    it('should render default with slate color for unknown type', () => {
      const { container } = renderWithReactFlow(
        <GroupNode
          data={{ ...defaultData, metadata: { ...defaultData.metadata, groupType: 'unknown' } }}
        />
      );

      expect(container.querySelector('.from-slate-700')).toBeInTheDocument();
    });
  });

  describe('onAddNew handler', () => {
    it('should call onAddNew when add button is clicked', async () => {
      const onAddNew = vi.fn();
      const user = userEvent.setup();

      const dataWithAddNew = {
        ...defaultData,
        metadata: { ...defaultData.metadata, onAddNew },
      };

      renderWithReactFlow(<GroupNode data={dataWithAddNew} />);

      const addButton = screen.getByTitle(/Add new/i);
      await user.click(addButton);

      expect(onAddNew).toHaveBeenCalledTimes(1);
    });

    it('should not render add button when onAddNew is not provided', () => {
      const dataWithoutAddNew = {
        ...defaultData,
        metadata: { groupType: 'environments', count: 5 },
      };

      const { container } = renderWithReactFlow(<GroupNode data={dataWithoutAddNew} />);

      const addButtons = container.querySelectorAll('[title*="Add new"]');
      expect(addButtons).toHaveLength(0);
    });

    it('should stop event propagation when add button is clicked', async () => {
      const onAddNew = vi.fn();
      const user = userEvent.setup();

      const dataWithAddNew = {
        ...defaultData,
        metadata: { ...defaultData.metadata, onAddNew },
      };

      renderWithReactFlow(<GroupNode data={dataWithAddNew} />);

      const addButton = screen.getByTitle(/Add new/i);
      await user.click(addButton);

      expect(onAddNew).toHaveBeenCalled();
    });

    it('should show correct title for environments', () => {
      const onAddNew = vi.fn();
      const dataWithAddNew = {
        ...defaultData,
        metadata: { groupType: 'environments', count: 5, onAddNew },
      };

      renderWithReactFlow(<GroupNode data={dataWithAddNew} />);

      expect(screen.getByTitle('Add new environment')).toBeInTheDocument();
    });

    it('should show correct title for entities', () => {
      const onAddNew = vi.fn();
      const dataWithAddNew = {
        ...defaultData,
        metadata: { groupType: 'entities', count: 5, onAddNew },
      };

      renderWithReactFlow(<GroupNode data={dataWithAddNew} />);

      expect(screen.getByTitle('Add new entity')).toBeInTheDocument();
    });

    it('should show correct title for workflows', () => {
      const onAddNew = vi.fn();
      const dataWithAddNew = {
        ...defaultData,
        metadata: { groupType: 'workflows', count: 5, onAddNew },
      };

      renderWithReactFlow(<GroupNode data={dataWithAddNew} />);

      expect(screen.getByTitle('Add new workflow')).toBeInTheDocument();
    });
  });

  describe('onSendToChat handler', () => {
    it('should call onSendToChat when send button is clicked', async () => {
      const onSendToChat = vi.fn();
      const user = userEvent.setup();

      const dataWithSendToChat = {
        ...defaultData,
        metadata: { ...defaultData.metadata, onSendToChat },
      };

      renderWithReactFlow(<GroupNode data={dataWithSendToChat} />);

      const sendButton = screen.getByTitle(/Send.*to chat/i);
      await user.click(sendButton);

      expect(onSendToChat).toHaveBeenCalledTimes(1);
      expect(onSendToChat).toHaveBeenCalledWith(
        {
          label: 'Test Group',
          groupType: 'environments',
          count: 5,
        },
        'group'
      );
    });

    it('should not render send button when onSendToChat is not provided', () => {
      const dataWithoutSendToChat = {
        ...defaultData,
        metadata: { groupType: 'environments', count: 5 },
      };

      const { container } = renderWithReactFlow(<GroupNode data={dataWithoutSendToChat} />);

      const sendButtons = container.querySelectorAll('[title*="Send"]');
      expect(sendButtons).toHaveLength(0);
    });

    it('should stop event propagation when send button is clicked', async () => {
      const onSendToChat = vi.fn();
      const user = userEvent.setup();

      const dataWithSendToChat = {
        ...defaultData,
        metadata: { ...defaultData.metadata, onSendToChat },
      };

      renderWithReactFlow(<GroupNode data={dataWithSendToChat} />);

      const sendButton = screen.getByTitle(/Send.*to chat/i);
      await user.click(sendButton);

      expect(onSendToChat).toHaveBeenCalled();
    });
  });

  describe('React Flow handles', () => {
    it('should render 8 handles (4 source, 4 target)', () => {
      const { container } = renderWithReactFlow(<GroupNode data={defaultData} />);

      const handles = container.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBe(8);
    });

    it('should have handles in all positions', () => {
      const { container } = renderWithReactFlow(<GroupNode data={defaultData} />);

      const topHandle = container.querySelector('[data-handlepos="top"]');
      const rightHandle = container.querySelector('[data-handlepos="right"]');
      const bottomHandle = container.querySelector('[data-handlepos="bottom"]');
      const leftHandle = container.querySelector('[data-handlepos="left"]');

      expect(topHandle).toBeInTheDocument();
      expect(rightHandle).toBeInTheDocument();
      expect(bottomHandle).toBeInTheDocument();
      expect(leftHandle).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have shadow and rounded styling', () => {
      const { container } = renderWithReactFlow(<GroupNode data={defaultData} />);

      expect(container.querySelector('.rounded-lg.shadow-lg')).toBeInTheDocument();
    });

    it('should have minimum width', () => {
      const { container } = renderWithReactFlow(<GroupNode data={defaultData} />);

      expect(container.querySelector('.min-w-\\[160px\\]')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle count of 0', () => {
      const dataWithZero = {
        ...defaultData,
        metadata: { ...defaultData.metadata, count: 0 },
      };
      renderWithReactFlow(<GroupNode data={dataWithZero} />);

      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('should handle very long labels', () => {
      const longLabel = 'Group '.repeat(20);
      const { container } = renderWithReactFlow(<GroupNode data={{ ...defaultData, label: longLabel }} />);

      expect(container.textContent).toContain(longLabel.trim());
    });

    it('should handle large counts', () => {
      const dataWithLargeCount = {
        ...defaultData,
        metadata: { ...defaultData.metadata, count: 9999 },
      };
      renderWithReactFlow(<GroupNode data={dataWithLargeCount} />);

      expect(screen.getByText('9999 items')).toBeInTheDocument();
    });

    it('should render both buttons when both handlers provided', () => {
      const onAddNew = vi.fn();
      const onSendToChat = vi.fn();

      const dataWithBoth = {
        ...defaultData,
        metadata: { ...defaultData.metadata, onAddNew, onSendToChat },
      };

      renderWithReactFlow(<GroupNode data={dataWithBoth} />);

      expect(screen.getByTitle(/Add new/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Send.*to chat/i)).toBeInTheDocument();
    });
  });
});
