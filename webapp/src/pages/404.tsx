import React from 'react';
import { Result } from 'antd';


export const NoFoundPage: React.FC = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
  />
);

