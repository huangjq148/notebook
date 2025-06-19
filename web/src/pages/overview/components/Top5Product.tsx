import { PieChart } from '@/components';
import { List, Radio } from 'antd';
import styles from '../index.module.less';
import { useState } from 'react';

type TopData = {
  name: string;
  money: string;
};
export default function Charts(props: { data: any }) {
  const { data = {} } = props;
  const [type, setType] = useState('chart');

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          height: 40,
        }}
      >
        <span>{data.label}</span>
        <Radio.Group value={type} buttonStyle="solid" onChange={(e) => setType(e.target.value)}>
          <Radio.Button value="chart">图表</Radio.Button>
          <Radio.Button value="list">列表</Radio.Button>
        </Radio.Group>
      </div>

      <div
        style={{
          height: 'calc(100% - 40px - 20px)',
          width: '100%',
        }}
      >
        {type === 'chart' ? (
          <PieChart data={props?.data?.data} dataKey={'money'} showInnerLabel showOuterLabel />
        ) : (
          <List
            className={styles.listDataContainer}
            key={data?.label}
            header={<div>{data?.label}</div>}
            bordered
            dataSource={data?.data ?? []}
            renderItem={(item: TopData) => (
              <List.Item>
                <>
                  <span>{item.name}</span>
                  <span>{parseFloat(item.money).toFixed(2)}</span>
                </>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
