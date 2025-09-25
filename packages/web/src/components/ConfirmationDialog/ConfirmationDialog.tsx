import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button } from 'antd';
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
    return '500px';
  };

  return (
    <Modal
      className="confirmation-dialog"
      open={visible}
      title="Consent Dialog"
      width={getWidth()}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={[
        <Button
          key="confirm"
          type="primary"
          disabled={!checkbox}
          onClick={onClickClose}
          className="btn btn-primary"
        >
          Confirm
        </Button>
      ]}
    >
      <div className="confirmation-dialog__text">
        <Checkbox
          checked={checkbox}
          onChange={(e) => setCheckbox(e.target.checked)}
        >
          By using this service, you confirm that you have read and agree to our{' '}
          <a target="_blank" href="https://www.cyoda.com/terms-of-service" rel="noopener noreferrer">
            Terms & Conditions
          </a>
          {' '}and{' '}
          <a target="_blank" href="https://www.cyoda.com/privacy-policy" rel="noopener noreferrer">
            Privacy Policy
          </a>.
        </Checkbox>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
