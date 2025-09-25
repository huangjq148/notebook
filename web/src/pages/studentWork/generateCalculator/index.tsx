import { Card } from '@/components';
import { Button, Form, Input, InputNumber, Radio, Space } from 'antd';
import React, { useRef, useState } from 'react';
import styles from './index.module.less';

const GenerateCalculator = () => {
  const [form] = Form.useForm();
  const [list, setList] = useState<string[]>([]);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const onSubmit = (values: { count: number; range: number }) => {
    const { count, range } = values;

    setList([]);

    const newList: string[] = [];

    while (newList.length < count) {
      const result = (Math.ceil(Math.random() * 1000) % (range - 1)) + 1;
      const number1 = Math.ceil(Math.random() * 1000) % result;
      const number2 = result - number1;
      newList.push(`${number1} + ${number2} = `);
    }

    setList(newList);
  };

  function printArea() {
    if (!printAreaRef.current) {
      return;
    }
    // 1. 获取要打印的区域内容
    const content = printAreaRef.current.innerHTML;

    // 2. 打开一个新窗口写入内容
    const printWindow = window.open('', '');

    if (!printWindow) {
      console.warn('打印窗口被拦截或无法打开');
      return;
    }

    printWindow?.document?.write(`
    <html>
      <head>
        <title>打印</title>
        <style>
          /* 可以在这里添加打印样式 */
          body { font-family: sans-serif; padding: 20px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
    printWindow?.document.close();

    // 3. 等待新窗口加载完成后再打印
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
      printWindow.close(); // 打印完自动关闭窗口
    };
  }

  return (
    <Card header="生成计算题">
      <div>
        <div>
          <Form layout="inline" form={form} initialValues={{ count: 120 }} onFinish={onSubmit}>
            <Form.Item label="数量" name="count">
              <Radio.Group>
                <Radio value={40}>40</Radio>
                <Radio value={60}>60</Radio>
                <Radio value={80}>80</Radio>
                <Radio value={120}>120</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="范围" name="range">
              <InputNumber min={1}></InputNumber>
            </Form.Item>
            <Button type="primary" htmlType="submit">
              生成
            </Button>
            <Button onClick={printArea} style={{ marginLeft: 10 }}>
              打印
            </Button>
          </Form>
        </div>
        <div ref={printAreaRef} style={{ padding: 20, border: '1px solid #ccc', marginTop: 20, paddingTop: 40 }}>
          <div style={{ marginTop: -20, marginBottom: 5 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <span>姓名：__________</span>
              <span>日期：__________</span>
              <span>耗时：__________</span>
              <span>正确：_____ /{list.length}</span>
            </div>{' '}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', height: '100%' }}>
            {list.map((item, index) => (
              <div key={index} className={styles.printItem} style={{ width: '33%', fontSize: 16 }}>
                {item}
              </div>
            ))}
          </div>
          <div></div>
        </div>
      </div>
    </Card>
  );
};

export default GenerateCalculator;
