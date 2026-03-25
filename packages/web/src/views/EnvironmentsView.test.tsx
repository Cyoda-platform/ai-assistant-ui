import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnvironmentsView from './EnvironmentsView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ tokenType: 'private', isAuthenticated: true })
}));

describe('EnvironmentsView', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <EnvironmentsView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
