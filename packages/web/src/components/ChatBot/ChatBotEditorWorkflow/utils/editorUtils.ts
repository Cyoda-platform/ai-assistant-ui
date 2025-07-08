/**
 * Monaco editor utilities for workflow editor
 */

export interface EditorAction {
  id: string;
  label: string;
  contextMenuGroupId: string;
  keybindings: number[];
  run: (editor: any) => Promise<void>;
}

export interface QuestionRequestData {
  question: string;
}

/**
 * Create submit question editor action
 * Note: This is a simplified version that doesn't directly use Monaco
 */
export function createSubmitQuestionAction(
  questionRequest: (data: QuestionRequestData) => Promise<any>,
  setLoading: (loading: boolean) => void
): EditorAction {
  return {
    id: "submitQuestion",
    label: "Submit Question",
    contextMenuGroupId: "chatbot",
    keybindings: [],
    run: async (editor: any) => {
      setLoading(true);

      try {
        // Simplified implementation - actual logic should be in the component
        await questionRequest({ question: 'placeholder' });
      } catch (error) {
        console.error('Error in submit question action:', error);
      } finally {
        setLoading(false);
      }
    }
  };
}

/**
 * Validate JSON content
 */
export function validateEditorJson(content: string): {
  isValid: boolean;
  error?: string;
  data?: any;
} {
  try {
    const data = JSON.parse(content);
    return { isValid: true, data };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Format JSON content
 */
export function formatJsonContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.error('Failed to format JSON:', error);
    return content;
  }
}
