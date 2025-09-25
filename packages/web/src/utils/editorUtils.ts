/**
 * Monaco editor utilities for workflow editor
 */
import * as monaco from 'monaco-editor';
import { Modal, notification } from 'antd';
import { MutableRefObject } from 'react';

export interface EditorAction {
    id: string;
    label: string;
    contextMenuGroupId: string;
    keybindings: number[];
    run: (editor: monaco.editor.IStandaloneCodeEditor) => Promise<void>;
}

export interface QuestionRequestData {
    question: string;
    file?: File;
}

export interface AnswerRequestData {
    answer: string;
    file?: File;
}

export interface EditorActionConfig {
    isLoading: MutableRefObject<boolean>;
    currentFile: MutableRefObject<File | null>;
    questionRequest?: (data: QuestionRequestData) => Promise<{ data: { message: string } }>;
    onAnswer?: (data: AnswerRequestData) => void;
}

/**
 * Create submit question editor action
 */
export function createSubmitQuestionAction(config: EditorActionConfig): EditorAction {
    return {
        id: "submitQuestion",
        label: "Submit Question",
        contextMenuGroupId: "chatbot",
        keybindings: [
            monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyQ,
        ],
        run: async (editor: monaco.editor.IStandaloneCodeEditor) => {
            const selectedValue = editor.getModel()?.getValueInRange(editor.getSelection()!);

            if (!selectedValue) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Please select text before use it'
                });
                return;
            }

            if (!config.questionRequest) {
                console.error('questionRequest function is not provided');
                return;
            }

            try {
                config.isLoading.current = true;

                const dataRequest: QuestionRequestData = {
                    question: selectedValue
                };

                if (config.currentFile.current) {
                    dataRequest.file = config.currentFile.current;
                }

                const {data} = await config.questionRequest(dataRequest);
                config.currentFile.current = null;

                const position = editor.getPosition();
                const lineCount = editor.getModel()?.getLineCount() || 0;
                const message = data.message.replaceAll('```javascript', '').replaceAll('```', '').trim();
                let textToInsert = `/*\n${message}\n*/`;

                if (position && position.lineNumber === lineCount) {
                    textToInsert = '\n' + textToInsert;
                } else {
                    textToInsert = textToInsert + '\n';
                }

                const range = new monaco.Range(
                    (position?.lineNumber || 0) + 1,
                    1,
                    (position?.lineNumber || 0) + 1,
                    1
                );

                editor.executeEdits('DialogContentScriptEditor', [
                    {
                        range,
                        text: textToInsert,
                    },
                ]);

                editor.setPosition({
                    lineNumber: (position?.lineNumber || 0) + 1,
                    column: textToInsert.length + 1
                });

                notification.success({
                    message: 'Success',
                    description: 'The code was generated',
                });
            } finally {
                config.isLoading.current = false;
            }
        }
    };
}

/**
 * Create submit answer editor action
 */
export function createSubmitAnswerAction(config: EditorActionConfig): EditorAction {
    return {
        id: "submitAnswer",
        label: "Submit Answer",
        contextMenuGroupId: "chatbot",
        keybindings: [
            monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyA,
        ],
        run: async (editor: monaco.editor.IStandaloneCodeEditor) => {
            const selectedValue = editor.getModel()?.getValueInRange(editor.getSelection()!);

            if (!selectedValue) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Please select text before use it'
                });
                return;
            }

            if (!config.onAnswer) {
                console.error('onAnswer function is not provided');
                return;
            }

            const dataRequest: AnswerRequestData = {
                answer: selectedValue
            };

            if (config.currentFile.current) {
                dataRequest.file = config.currentFile.current;
            }

            config.onAnswer(dataRequest);
            notification.success({
                message: 'Success',
                description: 'The answer was sent in the main window chat.',
            });
            config.currentFile.current = null;
        }
    };
}

/**
 * Create editor actions for markdown editor
 */
export function createMarkdownEditorActions(config: EditorActionConfig): EditorAction[] {
    const actions: EditorAction[] = [];

    if (config.questionRequest) {
        actions.push(createSubmitQuestionAction(config));
    }

    if (config.onAnswer) {
        actions.push(createSubmitAnswerAction(config));
    }

    return actions;
}

/**
 * Create editor actions for workflow editor (JSON editor)
 */
export function createWorkflowEditorActions(config: EditorActionConfig & {
    technicalId: string;
    assistantStore: any;
}): EditorAction[] {
    const actions: EditorAction[] = [];

    actions.push({
        id: "submitQuestion",
        label: "Submit Question",
        contextMenuGroupId: "chatbot",
        keybindings: [
            monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyQ,
        ],
        run: async (editor: monaco.editor.IStandaloneCodeEditor) => {
            const selectedValue = editor.getModel()?.getValueInRange(editor.getSelection()!);

            if (!selectedValue) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Please select text before use it'
                });
                return;
            }

            try {
                config.isLoading.current = true;

                const dataRequest = {
                    question: selectedValue
                };

                const {data} = await config.assistantStore.postTextQuestions(config.technicalId, dataRequest);

                const position = editor.getPosition();
                const lineCount = editor.getModel()?.getLineCount() || 0;
                const message = data.message.replaceAll('```json', '').replaceAll('```', '').trim();
                let textToInsert = `/*\n${message}\n*/`;

                if (position && position.lineNumber === lineCount) {
                    textToInsert = '\n' + textToInsert;
                } else {
                    textToInsert = textToInsert + '\n';
                }

                const range = new monaco.Range(
                    (position?.lineNumber || 0) + 1,
                    1,
                    (position?.lineNumber || 0) + 1,
                    1
                );

                editor.executeEdits('WorkflowEditor', [
                    {
                        range,
                        text: textToInsert,
                    },
                ]);

                editor.setPosition({
                    lineNumber: (position?.lineNumber || 0) + 1,
                    column: textToInsert.length + 1
                });

                notification.success({
                    message: 'Success',
                    description: 'The workflow suggestion was generated',
                });
            } finally {
                config.isLoading.current = false;
            }
        }
    });

    if (config.onAnswer) {
        actions.push(createSubmitAnswerAction(config));
    }

    return actions;
}
