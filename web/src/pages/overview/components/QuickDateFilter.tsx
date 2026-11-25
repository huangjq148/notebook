import { Button, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import styles from '../index.module.less';

type DateRange = 'today' | 'week' | 'month' | 'year';
const options: { label: string; value: DateRange }[] = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' },
];
const getRange = (range: DateRange): [Dayjs, Dayjs] => {
  const now = dayjs();
  return [now.startOf(range === 'today' ? 'day' : range), now];
};
export default function QuickDateFilter({
  value,
  onChange,
}: {
  value: [Dayjs, Dayjs];
  onChange: (dates: [Dayjs, Dayjs]) => void;
}) {
  return (
    <div className={styles.quickDateFilter}>
      <div className={styles.quickOptions}>
        {options.map((option) => {
          const range = getRange(option.value);
          const active = value[0].isSame(range[0], 'day') && value[1].isSame(range[1], 'day');
          return (
            <Button key={option.value} type={active ? 'primary' : 'default'} onClick={() => onChange(range)}>
              {option.label}
            </Button>
          );
        })}
      </div>
      <DatePicker.RangePicker
        value={value}
        allowClear={false}
        onChange={(dates) => {
          if (dates?.[0] && dates[1]) onChange([dates[0], dates[1]]);
        }}
        format="YYYY-MM-DD"
      />
    </div>
  );
}
