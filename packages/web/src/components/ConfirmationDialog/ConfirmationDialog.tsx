import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/app';

const ConfirmationDialog: React.FC = () => {
  const appStore = useAppStore();
  const [visible, setVisible] = useState(appStore.consentDialog);
  const [checkbox, setCheckbox] = useState(false);

  useEffect(() => {
    setVisible(appStore.consentDialog);
  }, [appStore.consentDialog]);

  const onClickClose = () => {
    setVisible(false);
    appStore.setConsentDialog(false);
  };

  const getWidth = () => {
    if (window.innerWidth < 768) { // md breakpoint
      return '90%';
    }
    return '540px';
  };

  return (
    <Modal
      className="confirmation-dialog"
      open={visible}
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20">
            <SafetyOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Terms & Conditions
            </div>
            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Please review and accept to continue
            </div>
          </div>
        </div>
      }
      width={getWidth()}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      footer={
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            key="confirm"
            type="primary"
            size="large"
            disabled={!checkbox}
            onClick={onClickClose}
            className="min-w-[120px] h-10 font-medium"
          >
            I Accept
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
        </div>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
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
