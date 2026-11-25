import { Empty, Radio, Tooltip } from 'antd';
import { useState } from 'react';
import type { RankingItem } from '@/services/overview';
import styles from '../index.module.less';

export default function Top5Product({ title, data }: { title: string; data: RankingItem[] }) {
  const [type, setType] = useState('chart');
  const max = Math.max(...data.map((item) => Math.abs(item.money)), 1);
  return (
    <div>
      <div className={styles.rankingHeading}>
        <h3>{title}</h3>
        <Radio.Group size="small" value={type} buttonStyle="solid" onChange={(event) => setType(event.target.value)}>
          <Radio.Button value="chart">图表</Radio.Button>
          <Radio.Button value="list">列表</Radio.Button>
        </Radio.Group>
      </div>
      {data.length ? (
        <ol className={styles.rankingList}>
          {data.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.rankContent}>
                <div className={styles.rankValue}>
                  <Tooltip title={item.name}>
                    <span className={styles.rankName}>{item.name || '未命名'}</span>
                  </Tooltip>
                  <span className={styles.money}>
                    ¥{item.money.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {type === 'chart' && (
                  <div className={styles.barTrack}>
                    <div
                      style={{
                        width: `${(Math.abs(item.money) / max) * 100}%`,
                        background: item.money < 0 ? '#ff7875' : '#69b1ff',
                      }}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="所选时段暂无数据" />
      )}
    </div>
  );
}
