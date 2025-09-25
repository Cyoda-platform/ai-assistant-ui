import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';

const LoginPopUp: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { loginWithRedirect } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: { prompt: 'login' }
    });
  };

  return (
    <Modal
      title="Login Required"
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setVisible(false)}>
          Cancel
        </Button>,
        <Button key="login" type="primary" onClick={handleLogin}>
          Log in
        </Button>,
      ]}
    >
      <p>Please log in to continue.</p>
    </Modal>
  );
};

export default LoginPopUp;
