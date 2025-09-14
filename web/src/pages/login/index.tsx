import { FormOutlined, QrcodeOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import styles from './index.module.less';
import Password from './Password';
import QrCode from './QrCode';

const App: React.FC = () => {
  const [type, setType] = useState<'password' | 'qrCode'>('password');

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formWrapper}>
        {/* <div
          className={styles.switchType}
          onClick={() => setType((val) => (val === 'password' ? 'qrCode' : 'password'))}
        >
          {type === 'password' ? <QrcodeOutlined /> : <FormOutlined />}
        </div> */}
        <div className={styles.loginFormTitle}>登录</div>
        {type === 'password' ? <Password /> : <QrCode />}
      </div>
    </div>
  );
};

export default App;
