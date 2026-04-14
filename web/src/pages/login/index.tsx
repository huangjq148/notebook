import { LockOutlined } from '@ant-design/icons';
import React from 'react';
import styles from './index.module.less';
import Password from './Password';

const App: React.FC = () => {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <span className={styles.orbOne} />
        <span className={styles.orbTwo} />
        <span className={styles.orbThree} />
      </div>

      <div className={styles.shell}>
        <section className={styles.authPanel}>
          <div className={styles.formWrapper}>
            <div className={styles.panelHeader}>
              <div className={styles.brandMark}>
                <LockOutlined />
              </div>
              <div>
                <div className={styles.loginFormTitle}>登录系统</div>
                <div className={styles.loginFormSubtitle}>请输入账号信息以继续访问</div>
              </div>
            </div>
            <div className={styles.formArea}>
              <Password />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
