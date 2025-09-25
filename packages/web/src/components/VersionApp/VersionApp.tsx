import React from 'react';
import { useTranslation } from 'react-i18next';

interface VersionAppProps {
  small?: boolean;
}

const VersionApp: React.FC<VersionAppProps> = ({ small = false }) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`version-app ${small ? 'small' : ''}`}
    >
      {t('version_app.small')}
    </div>
  );
};

export default VersionApp;
