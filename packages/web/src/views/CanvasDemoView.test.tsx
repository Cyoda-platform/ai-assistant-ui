import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CanvasDemoView from './CanvasDemoView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('CanvasDemoView', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <CanvasDemoView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
