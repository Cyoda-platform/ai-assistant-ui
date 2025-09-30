import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Splitter, Button, Tooltip, Badge, Spin } from 'antd';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import Editor from '@/components/Editor/Editor';
import EditorViewMode from './EditorViewMode';
import ChatBotAttachFile, { ChatBotAttachFileRef } from './ChatBotAttachFile';
import HelperMarkdown from '@/helpers/HelperMarkdown';
import HelperStorage from '@/helpers/HelperStorage';
import { createMarkdownEditorActions, type EditorAction } from '@/utils/editorUtils';
import { useAssistantStore } from '@/stores/assistant';

interface ChatBotEditorMarkdownProps {
  technicalId: string;
  onAnswer: (data: { answer: string; files?: File[] }) => void;
}

const ChatBotEditorMarkdown: React.FC<ChatBotEditorMarkdownProps> = ({
  technicalId,
  onAnswer
}) => {
  const [editorActions, setEditorActions] = useState<EditorAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [editorSize, setEditorSize] = useState<number>(50);
  const [editorMode, setEditorMode] = useState('editorPreview');
  const [canvasData, setCanvasData] = useState('');

  const assistantStore = useAssistantStore();
  const chatBotAttachFileRef = useRef<ChatBotAttachFileRef>(null);
  const isLoadingRef = useRef(isLoading);
  const currentFileRef = useRef(currentFile);
  const helperStorage = new HelperStorage();

  // Storage keys
  const EDITOR_WIDTH = 'chatBotEditorMarkdown:width';
  const EDITOR_MODE = 'chatBotEditorMarkdown:editorMode';
  const markdownCanvasDataKey = `chatBotEditorMarkdown:canvasData:${technicalId}`;

  // Update refs when state changes
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  // Load initial values from storage
  useEffect(() => {
    const savedEditorSize = helperStorage.get(EDITOR_WIDTH, 50);
    const savedEditorMode = helperStorage.get(EDITOR_MODE, 'editorPreview');
    const savedCanvasData = helperStorage.get(markdownCanvasDataKey, '') || '';

    setEditorSize(typeof savedEditorSize === 'string' ? 50 : savedEditorSize);
    setEditorMode(savedEditorMode as string);
    setCanvasData(savedCanvasData.toString());
  }, [technicalId]);

  // Save to storage when values change
  useEffect(() => {
    helperStorage.set(EDITOR_WIDTH, editorSize);
  }, [editorSize]);

  useEffect(() => {
    helperStorage.set(EDITOR_MODE, editorMode);
  }, [editorMode]);

  useEffect(() => {
    helperStorage.set(markdownCanvasDataKey, canvasData);
  }, [canvasData, markdownCanvasDataKey]);

  const questionRequest = async (data: any) => {
    if (data.file) {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('question', data.question);
      return assistantStore.postQuestions(technicalId, formData);
    } else {
      return assistantStore.postTextQuestions(technicalId, data);
    }
  };

  // Initialize editor actions
  useEffect(() => {
    const actions = createMarkdownEditorActions({
      isLoading: isLoadingRef,
      currentFile: currentFileRef,
      questionRequest,
      onAnswer: (data) => {
        onAnswer(data);
      }
    });
    setEditorActions(actions);
  }, [onAnswer, technicalId]);

  const onAttachFile = () => {
    chatBotAttachFileRef.current?.openDialog(currentFile);
  };

  const countFiles = currentFile ? 1 : 0;

  const onSubmitQuestion = async () => {
    try {
      setIsLoading(true);

      const dataRequest = {
        question: canvasData
      };

      if (currentFile) {
        (dataRequest as any).file = currentFile;
      }

      const { data } = await questionRequest(dataRequest);
      setCurrentFile(null);
      setCanvasData(prev => prev + `\n/*\n${data.message}\n*/`);
    } finally {
      setIsLoading(false);
    }
  };

  const onFile = (file: File | null) => {
    setCurrentFile(file);
  };

  const onClear = () => {
    setCanvasData('');
  };

  const isShowMarkdown = ['preview', 'editorPreview'].includes(editorMode);
  const isShowEditor = ['editor', 'editorPreview'].includes(editorMode);

  const canvasDataWithMarkdown = useMemo(() => {
    return HelperMarkdown.parseMarkdown(canvasData);
  }, [canvasData]);

  return (
    <Spin spinning={isLoading}>
      <div className="chat-bot-editor-markdown" style={{ minHeight: 'calc(100vh - 137px)', height: 'calc(100% - 137px)' }}>
        <EditorViewMode
          value={editorMode}
          onChange={setEditorMode}
          onClear={onClear}
        />

        <Splitter
          onResize={(sizes) => {
            if (sizes && sizes[0]) {
              setEditorSize(sizes[0]);
            }
          }}
        >
          {isShowEditor && (
            <Splitter.Panel size={editorSize} style={{ paddingRight: '15px', position: 'relative' }}>
              <Editor
                value={canvasData}
                onChange={setCanvasData}
                actions={editorActions}
                style={{ minHeight: '100%' }}
                className="chat-bot-editor-markdown__editor-inner"
              />
              <div className="chat-bot-editor-markdown__actions" style={{
                position: 'absolute',
                right: '15px',
                bottom: '20px',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg-new-chat)',
                border: '1px solid var(--input-border)',
                padding: '9px 12px',
                borderRadius: '4px'
              }}>
                <Tooltip title="Send Answer" placement="left">
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    onClick={onSubmitQuestion}
                    className="btn-white btn-icon"
                  />
                </Tooltip>
                <Tooltip title="Attach File" placement="left">
                  <Badge count={countFiles} color="green" showZero={false}>
                    <Button
                      type="text"
                      icon={<PaperClipOutlined />}
                      onClick={onAttachFile}
                      className="btn-white btn-icon"
                    />
                  </Badge>
                </Tooltip>
              </div>
            </Splitter.Panel>
          )}

          {isShowMarkdown && (
            <Splitter.Panel style={{ paddingLeft: '15px' }}>
              <div
                className="chat-bot-editor-markdown__markdown-inner"
                style={{ height: '100%', overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: canvasDataWithMarkdown }}
              />
            </Splitter.Panel>
          )}
        </Splitter>

        <ChatBotAttachFile
          ref={chatBotAttachFileRef}
          onFile={onFile}
        />
      </div>
    </Spin>
  );
};

export default ChatBotEditorMarkdown;
