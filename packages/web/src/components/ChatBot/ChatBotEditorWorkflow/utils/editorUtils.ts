/**
 * Monaco editor utilities for workflow editor
 */

import * as monaco from 'monaco-editor';
import { ElMessageBox, ElNotification } from 'element-plus';

export interface EditorAction {
  id: string;
  label: string;
  contextMenuGroupId: string;
  keybindings: number[];
  run: (editor: monaco.editor.IStandaloneCodeEditor) => Promise<void>;
}

export interface QuestionRequestData {
  question: string;
}

/**
 * Create submit question editor action
 */
export function createSubmitQuestionAction(
  questionRequest: (data: QuestionRequestData) => Promise<any>,
  setLoading: (loading: boolean) => void
): EditorAction {
  return {
    id: "submitQuestion",
    label: "Submit Question",
    contextMenuGroupId: "chatbot",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyQ,
    ],
    run: async (editor: monaco.editor.IStandaloneCodeEditor) => {
      const selectedValue = editor.getModel()?.getValueInRange(editor.getSelection());

      if (!selectedValue) {
        ElMessageBox.alert('Please select text before use it', 'Warning');
        return;
      }

      try {
        setLoading(true);

        const dataRequest: QuestionRequestData = {
          question: selectedValue
        };

        const { data } = await questionRequest(dataRequest);

        const position = editor.getPosition();
        const lineCount = editor.getModel()?.getLineCount() || 0;
        const message = data.message
          .replaceAll('```javascript', '')
          .replaceAll('```', '')
          .trim();
        
        let textToInsert = `/*\n${message}\n*/`;
        
        if (position && position.lineNumber === lineCount) {
          textToInsert = '\n' + textToInsert;
        } else {
          textToInsert = textToInsert + '\n';
        }

        if (position) {
          const range = new monaco.Range(
            position.lineNumber + 1,
            1,
            position.lineNumber + 1,
            1
          );
          
          editor.executeEdits('DialogContentScriptEditor', [
            {
              range,
              text: textToInsert,
            },
          ]);
          
          editor.setPosition({
            lineNumber: position.lineNumber + 1,
            column: textToInsert.length + 1
          });
        }

        ElNotification({
          title: 'Success',
          message: 'The code was generated',
          type: 'success',
        });
      } catch (error) {
        console.error('Error generating code:', error);
        ElNotification({
          title: 'Error',
          message: 'Failed to generate code',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };
}
