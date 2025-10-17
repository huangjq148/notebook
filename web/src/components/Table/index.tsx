import { getNumToLocaleString } from '@/utils/utils';
import { CaretDownOutlined, CaretUpOutlined, MinusOutlined } from '@ant-design/icons';
import { Table as AntTable, TableColumnType as AntdTableColumnType, TablePaginationConfig, Tooltip } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styles from './index.module.less';
import { useDict, DictKeys } from '@/hooks';

export interface TableColumnType extends AntdTableColumnType<any> {
  dataType?: 'date' | 'percent' | 'float' | 'code' | 'unix';
  code?: DictKeys;
  dataFormat?: string;
  title: string | React.ReactNode;
  dataIndex: string;
  render?: (val: any, record: any) => React.ReactNode;
  unit?: string;
  desc?: string;
  haCompare?: boolean;
  decimal?: number;
  dragSupport?: any;
  width?: number | string;
}

type Props = {
  columns: TableColumnType[];
  dataSource: any[];
  rowSelection?: any;
  rowKey?: string;
  pagination?: boolean | TablePaginationConfig;
  onSortChange?: (newList: any) => void;
};

const toPercent = (val: number, decimal?: number) => {
  return `${getNumToLocaleString((val * 100).toFixed(decimal ?? 2), { dw: '%' })}`;
};

const toFloat = (val: number, decimal?: number) => {
  return val.toFixed(decimal ?? 2);
};

const Table = (props: Props) => {
  const { columns, dataSource, rowKey = 'id', pagination, ...restProps } = props;
  const { getDict } = useDict();
  const [innerDataSource, setInnerDataSource] = useState<any>([]);

  useEffect(() => {
    if (props?.dataSource) {
      setInnerDataSource(dataSource);
    }
  }, [props.dataSource]);
  const displayColumns = columns.map((item) => {
    return {
      render: (val: any, record: any) => {
        let formatFun = (v: any, _?: number) => v;

        if (item.code) {
          formatFun = (value) => getDict(item.code as any, value);
        }

        if (item.dataType === 'date') {
          formatFun = (value) => (value ? dayjs(value).format(item.dataFormat || 'YYYY-MM-DD HH:mm:ss') : '-');
        } else if (item.dataType === 'unix') {
          formatFun = (value) => (value ? dayjs.unix(value).format(item.dataFormat || 'YYYY-MM-DD HH:mm') : '-');
        } else if (item.dataType === 'percent') {
          formatFun = toPercent;
        } else if (item.dataType === 'float') {
          formatFun = toFloat;
        }

        if (item.haCompare) {
          const value = val;
          const compareValue = record[item.dataIndex + 'Compare'];

          return (
            <div className={styles.compare}>
              <div>
                <div>{getNumToLocaleString(formatFun(value, item.decimal))}</div>
                <div className={styles.compareValue}>
                  {getNumToLocaleString(formatFun(record[item.dataIndex + 'Compare'], item.decimal))}
                </div>
              </div>
              <div
                className={classnames(styles.changeStatus, {
                  [styles.increase]: value > compareValue,
                  [styles.decrease]: value < compareValue,
                  [styles.noChange]: value === compareValue,
                })}
              >
                {record[item.dataIndex + 'Compare'] ? toPercent(Math.abs(value - compareValue) / compareValue) : '-'}
                {value > compareValue && <CaretUpOutlined />}
                {value === compareValue && <MinusOutlined />}
                {value < compareValue && <CaretDownOutlined />}
              </div>
            </div>
          );
        } else {
          const displayVal = getNumToLocaleString(formatFun(val, item.decimal));
          return displayVal;
        }
      },
      align: 'center' as const,
      ellipsis: item?.ellipsis,
      ...item,
    };
  });

  return (
    <AntTable
      bordered
      rowKey={rowKey}
      columns={displayColumns}
      dataSource={innerDataSource}
      // scroll={{ x: 'max-content' }}
      pagination={
        typeof pagination == 'object'
          ? {
              ...pagination,
              showTotal: (total: number) => `共 ${total} 条`,
              showSizeChanger: true,
            }
          : false
      }
      {...restProps}
    />
  );
};

export default Table;
