import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MonitoringView from './MonitoringView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('MonitoringView', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <MonitoringView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
