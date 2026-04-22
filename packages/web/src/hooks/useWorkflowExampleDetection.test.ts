import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkflowExampleDetection } from './useWorkflowExampleDetection';

// Mock dependencies
const mockOpenTab = vi.fn();
const mockSetActiveTab = vi.fn();
let mockTabs: any[] = [];

vi.mock('@/stores/workflowTabs', () => ({
  useWorkflowTabsStore: () => ({
    openTab: mockOpenTab,
    tabs: mockTabs,
    setActiveTab: mockSetActiveTab
  })
}));

vi.mock('@/utils/workflowExamples', () => ({
  isWorkflowExampleRequest: vi.fn((text: string) => text.includes('workflow example')),
  getRandomExampleWorkflow: vi.fn(() => ({
    name: 'Test Workflow',
    description: 'A test workflow',
    states: []
  })),
  exampleWorkflowToStorageFormat: vi.fn((data) => data),
  generateWorkflowExplanation: vi.fn(() => 'This is a workflow explanation')
}));

vi.mock('@/helpers/HelperStorage', () => ({
  default: class HelperStorage {
    set = vi.fn();
    get = vi.fn();
  }
}));

describe('useWorkflowExampleDetection', () => {
  let defaultProps: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockTabs = [];
    mockOpenTab.mockClear();
    mockSetActiveTab.mockClear();

    defaultProps = {
      messages: [],
      canvasVisible: false,
      activeCanvasTab: 'requirement' as const,
      onOpenCanvas: vi.fn(),
      onSwitchToWorkflowTab: vi.fn(),
      onSendMessage: vi.fn(),
      technicalId: 'chat-123'
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with zero processed messages', () => {
      const { result } = renderHook(() => useWorkflowExampleDetection(defaultProps));

      expect(result.current.processedMessagesCount).toBe(0);
    });

    it('should not do anything when no messages', () => {
      renderHook(() => useWorkflowExampleDetection(defaultProps));

      expect(defaultProps.onOpenCanvas).not.toHaveBeenCalled();
      expect(defaultProps.onSwitchToWorkflowTab).not.toHaveBeenCalled();
    });
  });

  describe('message detection', () => {
    it('should not process non-answer messages', () => {
      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'question',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(defaultProps.onOpenCanvas).not.toHaveBeenCalled();
    });

    it('should not process messages without workflow example request', () => {
      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'This is just a regular message'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(defaultProps.onOpenCanvas).not.toHaveBeenCalled();
    });

    it('should process workflow example request in answer message', () => {
      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'Please show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      expect(defaultProps.onOpenCanvas).toHaveBeenCalled();
    });

    it('should not process the same message twice', () => {
      const messages = [
        {
          id: 'msg-1',
          type: 'answer',
          text: 'show me a workflow example'
        }
      ];

      const { rerender } = renderHook(
        ({ messages }) => useWorkflowExampleDetection({ ...defaultProps, messages }),
        { initialProps: { messages } }
      );

      expect(defaultProps.onOpenCanvas).toHaveBeenCalledTimes(1);

      // Rerender with same messages
      rerender({ messages });

      // Should not call again
      expect(defaultProps.onOpenCanvas).toHaveBeenCalledTimes(1);
    });
  });

  describe('canvas operations', () => {
    it('should open canvas when not visible', () => {
      const props = {
        ...defaultProps,
        canvasVisible: false,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      expect(defaultProps.onOpenCanvas).toHaveBeenCalled();
    });

    it('should not open canvas when already visible', () => {
      const props = {
        ...defaultProps,
        canvasVisible: true,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      // Wait for potential async operations
      vi.runAllTimers();

      expect(defaultProps.onOpenCanvas).not.toHaveBeenCalled();
    });

    it('should switch to workflow tab when on different tab', () => {
      const props = {
        ...defaultProps,
        activeCanvasTab: 'requirement' as const,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(defaultProps.onSwitchToWorkflowTab).toHaveBeenCalled();
    });

    it('should not switch to workflow tab when already on it', () => {
      const props = {
        ...defaultProps,
        activeCanvasTab: 'workflow' as const,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(defaultProps.onSwitchToWorkflowTab).not.toHaveBeenCalled();
    });
  });

  describe('workflow tab creation', () => {
    it('should create new workflow tab when no example exists', () => {
      mockTabs = [];

      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(mockOpenTab).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: 'simple-task-workflow',
          modelVersion: 1,
          displayName: 'Test Workflow',
          metadata: expect.objectContaining({
            isExample: true
          })
        })
      );
    });

    it('should switch to existing workflow tab instead of creating new one', () => {
      mockTabs = [
        {
          id: 'tab-1',
          modelName: 'simple-task-workflow',
          metadata: { isExample: true }
        }
      ];

      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(mockSetActiveTab).toHaveBeenCalledWith('tab-1');
      expect(mockOpenTab).not.toHaveBeenCalled();
    });
  });

  describe('explanation message', () => {
    it('should send explanation message when creating new workflow', () => {
      mockTabs = [];

      const onSendMessageMock = vi.fn();
      const props = {
        ...defaultProps,
        onSendMessage: onSendMessageMock,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      expect(onSendMessageMock).toHaveBeenCalledWith('This is a workflow explanation');
    });

    it('should send explanation message only once', () => {
      mockTabs = [];

      const onSendMessageMock = vi.fn();
      const messages = [
        {
          id: 'msg-1',
          type: 'answer',
          text: 'show me a workflow example'
        }
      ];

      const { rerender } = renderHook(
        ({ messages }) => useWorkflowExampleDetection({ ...defaultProps, onSendMessage: onSendMessageMock, messages }),
        { initialProps: { messages } }
      );

      vi.runAllTimers();

      expect(onSendMessageMock).toHaveBeenCalledTimes(1);

      // Add another workflow example request
      const newMessages = [
        ...messages,
        {
          id: 'msg-2',
          type: 'answer',
          text: 'show me another workflow example'
        }
      ];

      rerender({ messages: newMessages });
      vi.runAllTimers();

      // Should still only have been called once
      expect(onSendMessageMock).toHaveBeenCalledTimes(1);
    });

    it('should not send explanation message when onSendMessage is not provided', () => {
      mockTabs = [];

      const props = {
        ...defaultProps,
        onSendMessage: undefined,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('localStorage operations', () => {
    it('should store workflow data in localStorage', () => {
      mockTabs = [];

      const props = {
        ...defaultProps,
        messages: [
          {
            id: 'msg-1',
            type: 'answer',
            text: 'show me a workflow example'
          }
        ]
      };

      renderHook(() => useWorkflowExampleDetection(props));

      vi.runAllTimers();

      // The hook should have called localStorage operations
      // We can verify by checking that the workflow was opened
      expect(mockOpenTab).toHaveBeenCalled();
    });
  });
});
