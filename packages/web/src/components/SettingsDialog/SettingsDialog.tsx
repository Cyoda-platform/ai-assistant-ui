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
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">General Settings</h3>
            <p className="text-gray-600">
              Application settings will be available here. Sidebar navigation is fixed and cannot be customized.
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">
              More settings options will be added in future updates.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsDialog;
