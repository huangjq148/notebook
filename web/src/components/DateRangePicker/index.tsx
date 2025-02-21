import React from "react";
import { DatePicker as AntDatePicker, DatePickerProps as AntDatePickerProps } from "antd";
import dayjs from "dayjs";

export type DatePickerProps = {} & AntDatePickerProps;

const DatePicker: React.FC<DatePickerProps> = (props: any) => {
  return (
    // @ts-ignore
    <AntDatePicker.RangePicker
      presets={[
        { label: "今天", value: [dayjs(), dayjs()] },
        { label: "昨天", value: [dayjs().add(-1, "day"), dayjs().add(-1, "day")] },
        { label: "上周", value: [dayjs().add(-7, "day").day(1), dayjs().add(-7, "day").day(7)] },
        { label: "本周", value: [dayjs().day(1), dayjs()] },
        {
          label: "上月",
          value: [dayjs().add(-1, "month").startOf("month"), dayjs().add(-1, "month").endOf("month")],
        },
        { label: "本月", value: [dayjs().startOf("month"), dayjs()] },
      ]}
      format={(val) => dayjs(val).format("YYYY-MM-DD")}
      allowClear
      placeholder={["起始日期", "结束日期"]}
      {...props}
    ></AntDatePicker.RangePicker>
  );
};

export default DatePicker;
