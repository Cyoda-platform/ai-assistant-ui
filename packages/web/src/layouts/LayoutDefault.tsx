import React from 'react';
import { Row, Col } from 'antd';

interface LayoutDefaultProps {
  children: React.ReactNode;
}

const LayoutDefault: React.FC<LayoutDefaultProps> = ({ children }) => {
  return (
    <Row className="layout-default">
      <Col span={24} className="layout-default__main">
        {children}
      </Col>
    </Row>
  );
};

export default LayoutDefault;
