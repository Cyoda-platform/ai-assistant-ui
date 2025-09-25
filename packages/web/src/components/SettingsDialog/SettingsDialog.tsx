import React from 'react';
import { Modal } from 'antd';

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div>
        <p>Settings dialog placeholder - will be implemented during detailed component migration.</p>
      </div>
    </Modal>
  );
};

export default SettingsDialog;
