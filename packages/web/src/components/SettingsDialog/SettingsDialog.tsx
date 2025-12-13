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
      <div className="p-4">
        <p className="text-gray-600">
          Settings options will be added in future updates.
        </p>
      </div>
    </Modal>
  );
};

export default SettingsDialog;
