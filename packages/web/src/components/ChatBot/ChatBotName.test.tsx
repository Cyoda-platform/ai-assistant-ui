import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatBotName from './ChatBotName';

describe('ChatBotName', () => {
  it('should render the component with technicalId', () => {
    render(<ChatBotName technicalId="test-bot-123" />);

    expect(screen.getByText('Chat test-bot-123')).toBeInTheDocument();
  });

  it('should apply the correct class name', () => {
    const { container } = render(<ChatBotName technicalId="bot-456" />);

    expect(container.querySelector('.chat-bot-name')).toBeInTheDocument();
  });

  it('should render an h3 element', () => {
    render(<ChatBotName technicalId="bot-789" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Chat bot-789');
  });

  it('should handle empty technicalId', () => {
    render(<ChatBotName technicalId="" />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should handle special characters in technicalId', () => {
    render(<ChatBotName technicalId="bot-#123-$456" />);

    expect(screen.getByText('Chat bot-#123-$456')).toBeInTheDocument();
  });
});
