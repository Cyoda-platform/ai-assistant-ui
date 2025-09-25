import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingText: React.FC = () => {
  const { t } = useTranslation();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timeIntervalId = setInterval(() => {
      setCounter(prev => (prev >= 3 ? 0 : prev + 1));
    }, 1000);

    return () => {
      clearInterval(timeIntervalId);
    };
  }, []);

  const label = useMemo(() => {
    return `${t('common.loading')} ${'.'.repeat(counter)}`;
  }, [t, counter]);

  return <span>{label}</span>;
};

export default LoadingText;
