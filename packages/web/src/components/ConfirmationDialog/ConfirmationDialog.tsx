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
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <SafetyOutlined className="text-emerald-400 text-base" />
          </div>
          <div className="text-base font-semibold text-slate-100">
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
            type="default"
            size="large"
            disabled={!checkbox}
            onClick={onClickAccept}
            className="silver-accept-button min-w-[120px] h-10 font-medium text-black bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-200 hover:to-slate-300 border-slate-400 hover:border-slate-300 disabled:from-slate-600 disabled:to-slate-700 disabled:border-slate-600 disabled:text-slate-400"
          >
            I Accept
          </Button>
        </div>
      }
    >
      <div className="py-3 px-1">
        <p className="text-sm text-slate-200 leading-relaxed mb-4">
          By using this service, you confirm that you have read and agree to our{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/terms-of-service"
            rel="noopener noreferrer"
            className="terms-conditions-button inline-block px-2 py-1 text-black font-medium bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-200 hover:to-slate-300 rounded-md border border-slate-400 hover:border-slate-300 transition-all duration-200 text-xs"
          >
            Terms & Conditions
          </a>
          {' '}and{' '}
          <a
            target="_blank"
            href="https://www.cyoda.com/privacy-policy"
            rel="noopener noreferrer"
            className="privacy-policy-button inline-block px-2 py-1 text-black font-medium bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-200 hover:to-slate-300 rounded-md border border-slate-400 hover:border-slate-300 transition-all duration-200 text-xs"
          >
            Privacy Policy
          </a>.
        </p>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={checkbox}
            onChange={(e) => setCheckbox(e.target.checked)}
            className="mt-0.5 [&_.ant-checkbox-inner]:bg-slate-700 [&_.ant-checkbox-inner]:border-slate-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-emerald-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:border-emerald-500"
          />
          <label
            className="text-sm text-slate-200 cursor-pointer select-none flex-1 leading-relaxed"
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
