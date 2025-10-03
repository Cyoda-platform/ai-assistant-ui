import React, { useState } from 'react';
import { Modal, Input, Form } from 'antd';

const ChatBotRenameDialog: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      setVisible(false);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Rename Chat"
      open={visible}
      onOk={handleOk}
      onCancel={() => setVisible(false)}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Chat Name"
          rules={[{ required: true, message: 'Please enter a chat name' }]}
        >
          <Input placeholder="Enter new chat name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChatBotRenameDialog;
