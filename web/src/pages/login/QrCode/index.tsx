import { QRCode } from 'antd';
import styles from './index.module.less';

const QrCode = () => {
  return (
    <div className={styles.qrCodeContainer}>
      <QRCode value={'scasc' || '-'} />
    </div>
  );
};

export default QrCode;
