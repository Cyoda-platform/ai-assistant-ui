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
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 border border-teal-200">
            <SafetyOutlined className="text-teal-600 text-base" />
          </div>
          <div className="text-base font-semibold text-slate-900">
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
        <div className="flex justify-end gap-3 px-1">
          <Button
            key="accept"
            type="primary"
            size="large"
            disabled={!checkbox}
            onClick={onClickAccept}
            className="min-w-[120px] h-10 font-medium"
            style={{
              background: !checkbox ? undefined : 'linear-gradient(to right, rgb(20, 184, 166), rgb(13, 148, 136))',
              borderColor: !checkbox ? undefined : 'rgb(20, 184, 166)',
              borderRadius: '8px',
              color: '#ffffff'
            }}
          >
            I Accept
          </Button>
        </div>
      }
    >
      <div className="py-3 px-1">
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          By using this service, you confirm that you have read and agree to our{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/terms-of-service"
            rel="noopener noreferrer"
            className="inline-block px-2 py-1 font-medium bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors text-xs text-teal-700"
          >
            Terms & Conditions
          </a>
          {' '}and{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/privacy-policy"
            rel="noopener noreferrer"
            className="inline-block px-2 py-1 font-medium bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors text-xs text-teal-700"
          >
            Privacy Policy
          </a>.
        </p>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={checkbox}
            onChange={(e) => setCheckbox(e.target.checked)}
            className="mt-0.5 [&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-teal-600 [&_.ant-checkbox-checked_.ant-checkbox-inner]:border-teal-600"
          />
          <label
            className="text-sm text-slate-700 cursor-pointer select-none flex-1 leading-relaxed"
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
