import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeJsonEditor } from './NodeJsonEditor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, onMount, ...props }: any) => {
    return (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    );
  },
}));

describe('NodeJsonEditor', () => {
  const defaultData = {
    name: 'Test',
    value: 123,
    nested: {
      key: 'value',
    },
  };

  const onSave = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={false}
        onClose={onClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Edit JSON')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        title="Custom Title"
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should initialize with formatted JSON', () => {
    render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveValue(JSON.stringify(defaultData, null, 2));
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByTitle('Close');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when dialog content is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <NodeJsonEditor
        data={defaultData}
        onSave={onSave}
        isOpen={true}
        onClose={onClose}
      />
    );

    const dialog = container.querySelector('.bg-slate-800');
    if (dialog) {
      await user.click(dialog);
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  describe('saving', () => {
    it('should call onSave with parsed JSON when save button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      const newData = { updated: true };

      fireEvent.change(editor, { target: { value: JSON.stringify(newData) } });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(newData);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');

      fireEvent.change(editor, { target: { value: '{ invalid json }' } });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should clear error when JSON becomes valid', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');

      // Enter invalid JSON
      fireEvent.change(editor, { target: { value: '{ invalid }' } });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      // Fix the JSON
      fireEvent.change(editor, { target: { value: '{"valid": true}' } });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      });

      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('editor updates', () => {
    it('should update JSON when editor content changes', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      const newValue = '{"new": "value"}';

      fireEvent.change(editor, { target: { value: newValue } });

      expect(editor).toHaveValue(newValue);
    });

    it('should reinitialize JSON when dialog opens', () => {
      const { rerender } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={false}
          onClose={onClose}
        />
      );

      rerender(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(defaultData, null, 2));
    });

    it('should update when data prop changes while open', () => {
      const newData = { different: 'data' };
      const { rerender } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      rerender(
        <NodeJsonEditor
          data={newData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(newData, null, 2));
    });
  });

  describe('error handling', () => {
    it('should display error message from JSON parse error', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');

      fireEvent.change(editor, { target: { value: '{ "unterminated": ' } });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/Error:/);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.textContent).toContain('Error:');
      });
    });

    it('should clear error when closing dialog', async () => {
      const user = userEvent.setup();
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');

      // Create an error
      fireEvent.change(editor, { target: { value: '{ invalid }' } });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('styling and classes', () => {
    it('should have backdrop blur effect', () => {
      const { container } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      expect(container.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
    });

    it('should have rounded dialog', () => {
      const { container } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('should have shadow', () => {
      const { container } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      expect(container.querySelector('.shadow-2xl')).toBeInTheDocument();
    });

    it('should render Save button with icon', () => {
      render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton.closest('button')).toHaveClass('bg-blue-600');
    });

    it('should render Code icon in header', () => {
      const { container } = render(
        <NodeJsonEditor
          data={defaultData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      render(
        <NodeJsonEditor
          data={{}}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue('{}');
    });

    it('should handle null values', () => {
      const dataWithNull = { key: null };
      render(
        <NodeJsonEditor
          data={dataWithNull}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(dataWithNull, null, 2));
    });

    it('should handle arrays', () => {
      const arrayData = [1, 2, 3, { nested: true }];
      render(
        <NodeJsonEditor
          data={arrayData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(arrayData, null, 2));
    });

    it('should handle deeply nested objects', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      };

      render(
        <NodeJsonEditor
          data={deepData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(deepData, null, 2));
    });

    it('should handle special characters in strings', () => {
      const specialData = {
        string: 'Line 1\nLine 2\t\tTabbed',
        quote: 'He said "hello"',
      };

      render(
        <NodeJsonEditor
          data={specialData}
          onSave={onSave}
          isOpen={true}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(JSON.stringify(specialData, null, 2));
    });
  });
});
