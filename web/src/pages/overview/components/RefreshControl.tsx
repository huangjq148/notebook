import { ReloadOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import { useEffect, useState } from 'react';
import styles from '../index.module.less';

export default function RefreshControl({
  onRefresh,
  loading,
  lastUpdateTime,
}: {
  onRefresh: () => void;
  loading?: boolean;
  lastUpdateTime?: Date;
}) {
  const [intervalTime, setIntervalTime] = useState(0);
  useEffect(() => {
    if (!intervalTime || loading) return;
    const timer = setInterval(onRefresh, intervalTime);
    return () => clearInterval(timer);
  }, [intervalTime, onRefresh, loading]);
  return (
    <div className={styles.refreshControl}>
      <span className={styles.lastUpdateTime}>
        更新于 {lastUpdateTime?.toLocaleTimeString('zh-CN', { hour12: false }) ?? '—'}
      </span>
      <Select
        aria-label="自动刷新频率"
        value={intervalTime}
        onChange={setIntervalTime}
        options={[
          { label: '自动刷新：关闭', value: 0 },
          { label: '每5分钟刷新', value: 300000 },
          { label: '每10分钟刷新', value: 600000 },
          { label: '每30分钟刷新', value: 1800000 },
        ]}
        style={{ width: 150 }}
      />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
        刷新
      </Button>
    </div>
  );
}
