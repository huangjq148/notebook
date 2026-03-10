import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Switch, Select, Tooltip, Space } from 'antd';
import { useEffect, useState } from 'react';
import styles from '../index.module.less';

interface RefreshControlProps {
  onRefresh: () => void;
  loading?: boolean;
  lastUpdateTime?: Date;
}

const AUTO_REFRESH_OPTIONS = [
  { label: '关闭', value: 0 },
  { label: '5分钟', value: 5 * 60 * 1000 },
  { label: '10分钟', value: 10 * 60 * 1000 },
  { label: '30分钟', value: 30 * 60 * 1000 },
];

export default function RefreshControl({
  onRefresh,
  loading,
  lastUpdateTime,
}: RefreshControlProps) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalTime, setIntervalTime] = useState(5 * 60 * 1000);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (autoRefresh && intervalTime > 0) {
      timer = setInterval(() => {
        onRefresh();
      }, intervalTime);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [autoRefresh, intervalTime, onRefresh]);

  const formatTime = (date?: Date) => {
    if (!date) return '未更新';
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={styles.refreshControl}>
      <Space align="center">
        <Tooltip title="手动刷新">
          <Button
            icon={<ReloadOutlined className={loading ? styles.spinning : ''} />}
            onClick={onRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </Tooltip>

        <div className={styles.autoRefreshControl}>
          <span>自动刷新:</span>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            size="small"
            style={{ marginLeft: 8 }}
          />
          {autoRefresh && (
            <Select
              value={intervalTime}
              onChange={setIntervalTime}
              options={AUTO_REFRESH_OPTIONS}
              size="small"
              style={{ width: 90, marginLeft: 8 }}
              disabled={!autoRefresh}
            />
          )}
        </div>

        <div className={styles.lastUpdateTime}>
          <ClockCircleOutlined />
          <span>最后更新: {formatTime(lastUpdateTime)}</span>
        </div>
      </Space>
    </div>
  );
}
