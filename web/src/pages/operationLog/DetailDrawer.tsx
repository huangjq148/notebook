import { getOperationLogDetail, type OperationLogRecord } from '@/services/operationLog';
import { Descriptions, Drawer, Empty, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from './index.module.less';

type Props = {
  open: boolean;
  id?: number;
  onClose: () => void;
};

type JsonObject = Record<string, unknown>;

// 快照/请求体都是字符串形式的 JSON，这里尽量解析，解析不了就原样展示
const parseJson = (raw?: string): JsonObject | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') {
      return { value: parsed };
    }
    return Array.isArray(parsed) ? { value: parsed } : (parsed as JsonObject);
  } catch {
    return null;
  }
};

const formatJson = (raw?: string) => {
  if (!raw) {
    return '-';
  }
  const parsed = parseJson(raw);
  return parsed ? JSON.stringify(parsed, null, 2) : raw;
};

const showValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const isSameValue = (a: unknown, b: unknown) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const OperationLogDetailDrawer = ({ open, id, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<OperationLogRecord>();

  useEffect(() => {
    if (!open || !id) {
      return;
    }

    let alive = true;
    setLoading(true);
    setDetail(undefined);

    getOperationLogDetail(id)
      .then((result) => {
        if (alive) {
          setDetail(result);
        }
      })
      .catch(() => {
        // 错误提示由全局请求拦截器统一处理
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [open, id]);

  const before = useMemo(() => parseJson(detail?.beforeData), [detail?.beforeData]);
  const after = useMemo(() => parseJson(detail?.afterData), [detail?.afterData]);

  const diffFields = useMemo(() => {
    if (!before || !after) {
      return [];
    }
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    return keys.map((key) => ({
      key,
      before: before[key],
      after: after[key],
      changed: !isSameValue(before[key], after[key]),
    }));
  }, [before, after]);

  const changedCount = diffFields.filter((item) => item.changed).length;

  return (
    <Drawer
      title="操作日志详情"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
      loading={loading}
    >
      {!detail ? (
        <Empty description="暂无数据" />
      ) : (
        <div>
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
              { key: 'createTime', label: '时间', children: detail.createTime || '-' },
              {
                key: 'operator',
                label: '操作人',
                children: detail.userName || detail.userId || '-',
              },
              { key: 'module', label: '模块', children: detail.module || '-' },
              { key: 'action', label: '动作', children: detail.action || '-' },
              { key: 'targetId', label: '目标 ID', children: detail.targetId || '-' },
              {
                key: 'result',
                label: '结果',
                children:
                  detail.success === 1 ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
              },
              { key: 'costMs', label: '耗时', children: detail.costMs != null ? `${detail.costMs} ms` : '-' },
              { key: 'ip', label: 'IP', children: detail.ip || '-' },
              { key: 'method', label: '请求方法', children: detail.method || '-' },
              {
                key: 'path',
                label: '请求路径',
                span: 2,
                children: detail.path || '-',
              },
              {
                key: 'statusCode',
                label: 'HTTP 状态码',
                children: detail.statusCode ?? '-',
              },
              {
                key: 'errMsg',
                label: '错误信息',
                children: detail.errMsg || '-',
              },
              {
                key: 'userAgent',
                label: 'User-Agent',
                span: 2,
                children: <span className={styles.wrapText}>{detail.userAgent || '-'}</span>,
              },
            ]}
          />

          {diffFields.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                改动对照
                <Tag color={changedCount > 0 ? 'warning' : 'default'} style={{ marginLeft: 8 }}>
                  {changedCount > 0 ? `${changedCount} 个字段发生变化` : '无字段变化'}
                </Tag>
              </div>
              <div className={styles.diffWrapper}>
                <table className={styles.diffTable}>
                  <thead>
                    <tr>
                      <th className={styles.fieldColumn}>字段</th>
                      <th>改前</th>
                      <th>改后</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffFields.map((item) => (
                      <tr key={item.key} className={item.changed ? styles.changedRow : undefined}>
                        <td className={styles.fieldColumn}>{item.key}</td>
                        <td>{showValue(item.before)}</td>
                        <td>{showValue(item.after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 只有单边快照（新增 / 删除）时，直接展示 JSON */}
          {diffFields.length === 0 && (detail.beforeData || detail.afterData) && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{detail.beforeData ? '改前数据' : '改后数据'}</div>
              <pre className={styles.jsonBlock}>{formatJson(detail.beforeData || detail.afterData)}</pre>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              请求体
              <span className={styles.sectionTip}>（密码 / token 等敏感字段已脱敏为 ***）</span>
            </div>
            <pre className={styles.jsonBlock}>{formatJson(detail.reqBody)}</pre>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default OperationLogDetailDrawer;
