import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingText: React.FC = () => {
  const { t } = useTranslation();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCounter(prev => (prev >= 3 ? 0 : prev + 1));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <span>
      {t('common.loading')} {'.'.repeat(counter)}
    </span>
  );
};

export default LoadingText;
