import React, { useState, useEffect } from 'react';
import { Modal, Button, Checkbox } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/app';

const ConfirmationDialog: React.FC = () => {
  const appStore = useAppStore();
  const [visible, setVisible] = useState(appStore.consentDialog);
  const [checkbox, setCheckbox] = useState(true);

  useEffect(() => {
    setVisible(appStore.consentDialog);
  }, [appStore.consentDialog]);

  const onClickAccept = () => {
    setVisible(false);
    appStore.setConsentDialog(false);
  };

  const getWidth = () => {
    if (window.innerWidth < 768) { // md breakpoint
      return '90%';
    }
    return '480px';
  };

  return (
    <Modal
      className="confirmation-dialog"
      open={visible}
      title={
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20">
            <SafetyOutlined className="text-blue-600 dark:text-blue-400 text-base" />
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Terms & Conditions
          </div>
        </div>
      }
      width={getWidth()}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered={false}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 'auto',
        paddingBottom: 0
      }}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            key="accept"
            type="primary"
            size="large"
            disabled={!checkbox}
            onClick={onClickAccept}
            className="min-w-[120px] h-10 font-medium"
          >
            I Accept
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          By using this service, you confirm that you have read and agree to our{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/terms-of-service"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline decoration-1 underline-offset-2 transition-colors"
          >
            Terms & Conditions
          </a>
          {' '}and{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/privacy-policy"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline decoration-1 underline-offset-2 transition-colors"
          >
            Privacy Policy
          </a>.
        </p>

        <div className="flex items-start gap-2">
          <Checkbox
            checked={checkbox}
            onChange={(e) => setCheckbox(e.target.checked)}
            className="mt-0.5"
          />
          <label
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none flex-1"
            onClick={() => setCheckbox(!checkbox)}
          >
            I have read and agree to the Terms & Conditions and Privacy Policy
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
