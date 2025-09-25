import React, { useState, useMemo } from 'react';
import { Button, Tooltip, notification } from 'antd';
import dayjs from 'dayjs';
import AiChaIcon from '@/assets/images/icons/ai-chat.svg';
import CopyIcon from '@/assets/images/icons/copy.svg';
import CheckIcon from '@/assets/images/icons/check.svg';
import HelperMarkdown from '@/helpers/HelperMarkdown';
import HelperCopy from '@/helpers/HelperCopy';

interface Message {
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
}

interface ChatBotMessageQuestionProps {
  message: Message;
  isLoading: boolean;
  onApproveQuestion: (data: any) => void;
}

const ChatBotMessageQuestion: React.FC<ChatBotMessageQuestionProps> = ({
  message,
  isLoading,
  onApproveQuestion
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);

  const computedMessage = useMemo(() => {
    const text = message.text;
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    }

    return HelperMarkdown.parseMarkdown(text);
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss');
  }, [message.last_modified]);

  const onClickApproveQuestion = () => {
    setIsLoadingApprove(true);
    onApproveQuestion(message.raw);
    setTimeout(() => {
      setIsLoadingApprove(false);
    }, 2000);
  };

  const onClickCopy = () => {
    const textToCopy = typeof message.text === 'string' ? message.text : JSON.stringify(message.text);
    HelperCopy.copy(textToCopy);
    notification.success({
      message: 'Success',
      description: 'The data has been copied',
    });
  };

  return (
    <div className="chat-bot-message-question">
      <div className="chat-bot-message-question__title">
        <span className="chat-bot-message-question__cyoda-wrapper-icon">
          <AiChaIcon />
        </span>
        <span>CYODA AI | <small className="chat-bot-message-question__date">{date}</small></span>

        <div className="chat-bot-message-question__top-actions">
          <Tooltip title="Copy" placement="top" mouseEnterDelay={1}>
            <Button
              onClick={onClickCopy}
              size="small"
              className="btn-default-lighter btn-icon"
              icon={<CopyIcon />}
            />
          </Tooltip>
        </div>
      </div>
      
      <div 
        dangerouslySetInnerHTML={{ __html: computedMessage }} 
        className="chat-bot-message-question__body"
      />
      
      <div className="chat-bot-message-question__bottom-actions">
        {message.approve && (
          <Tooltip title="Approve" placement="top" mouseEnterDelay={1}>
            <Button
              onClick={onClickApproveQuestion}
              size="small"
              disabled={isLoading}
              className="btn btn-primary btn-icon"
              loading={isLoadingApprove}
              icon={<CheckIcon className="fill-stroke" />}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ChatBotMessageQuestion;
