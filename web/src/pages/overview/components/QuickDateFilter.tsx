import { CalendarOutlined } from '@ant-design/icons';
import { Button, Space, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import styles from '../index.module.less';

const { RangePicker } = DatePicker;

interface QuickDateFilterProps {
  value?: [dayjs.Dayjs, dayjs.Dayjs];
  onChange?: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
}

type DateRange = 'today' | 'week' | 'month' | 'year';

const QUICK_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' },
];

export default function QuickDateFilter({ value, onChange }: QuickDateFilterProps) {
  const [activeRange, setActiveRange] = useState<DateRange | null>(null);

  const getDateRange = (range: DateRange): [dayjs.Dayjs, dayjs.Dayjs] => {
    const now = dayjs();
    switch (range) {
      case 'today':
        return [now.startOf('day'), now.endOf('day')];
      case 'week':
        return [now.startOf('week'), now.endOf('week')];
      case 'month':
        return [now.startOf('month'), now.endOf('month')];
      case 'year':
        return [now.startOf('year'), now.endOf('year')];
      default:
        return [now.startOf('day'), now.endOf('day')];
    }
  };

  const handleQuickSelect = (range: DateRange) => {
    setActiveRange(range);
    const dates = getDateRange(range);
    onChange?.(dates);
  };

  const handleDatePickerChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    setActiveRange(null);
    onChange?.(dates);
  };

  return (
    <div className={styles.quickDateFilter}>
      <Space align="center">
        <Space.Compact>
          {QUICK_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type={activeRange === option.value ? 'primary' : 'default'}
              onClick={() => handleQuickSelect(option.value)}
              size="small"
            >
              {option.label}
            </Button>
          ))}
        </Space.Compact>

        <RangePicker
          value={value}
          onChange={handleDatePickerChange}
          size="small"
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          suffixIcon={<CalendarOutlined />}
          allowClear
        />
      </Space>
    </div>
  );
}
