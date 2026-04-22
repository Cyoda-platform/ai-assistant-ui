import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VersionApp from './VersionApp';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'version_app.small': 'v1.0.0'
      };
      return translations[key] || key;
    }
  })
}));

describe('VersionApp', () => {
  it('should render with translated text', () => {
    render(<VersionApp />);

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('should have version-app class', () => {
    const { container } = render(<VersionApp />);

    expect(container.querySelector('.version-app')).toBeInTheDocument();
  });

  it('should not have small class by default', () => {
    const { container } = render(<VersionApp />);

    const versionApp = container.querySelector('.version-app');
    expect(versionApp).not.toHaveClass('small');
  });

  it('should have small class when small prop is true', () => {
    const { container } = render(<VersionApp small={true} />);

    const versionApp = container.querySelector('.version-app');
    expect(versionApp).toHaveClass('version-app', 'small');
  });

  it('should not have small class when small prop is false', () => {
    const { container } = render(<VersionApp small={false} />);

    const versionApp = container.querySelector('.version-app');
    expect(versionApp).toHaveClass('version-app');
    expect(versionApp).not.toHaveClass('small');
  });
});
