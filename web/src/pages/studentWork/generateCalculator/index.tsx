import { Card } from '@/components';
import { Button, Checkbox, Empty, Form, InputNumber, message, Radio } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import { useNavigate, useParams } from 'react-router-dom';
import { createCalculator, queryCalculatorById } from '@/services/calculator';

const GenerateCalculator = () => {
  const [form] = Form.useForm();
  const [list, setList] = useState<string[]>([]);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const navigator = useNavigate();

  const onSubmit = (values: { count: number; answerRange: number; operations: string[] }) => {
    const { count, answerRange, operations } = values;

    setList([]);

    const newList: string[] = [];

    while (newList.length < count) {
      const operationsLength = operations.length;
      const op = operations[Math.floor(Math.random() * 10) % operationsLength];
      const result = (Math.ceil(Math.random() * 1000) % (answerRange - 3)) + 3;
      let number1 = (Math.ceil(Math.random() * 1000) % (result - 2)) + 2;
      let number2 = result - number1;

      if (Number.isNaN(number1) || Number.isNaN(number2)) {
        debugger;
      }

      if (['-', '÷'].includes(op) && number2 > number1) {
        const tmp = number1;
        number1 = number2;
        number2 = tmp;
      }

      newList.push(`${number1} ${op} ${number2} = `);
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

  const save = async () => {
    if (!list?.length) {
      message.error('请先生成打印内容');
      return;
    }
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      await createCalculator({
        ...dataSource,
        count: values.count,
        answerRange: values.answerRange,
        operations: values.operations.join(','),
        content: list.join(','),
      });
      message.success('保存成功');
      setShowAnswer(false);
      navigator('/student-work/calculator-manage/list');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await queryCalculatorById(Number(id));

      const content = res.content.split(',');
      const operations = res.operations.split(',');
      setDataSource(content);
      form.setFieldsValue({
        count: res.count,
        answerRange: res.answerRange,
        operations: operations,
      });
      setList(content);
    } finally {
      setLoading(false);
    }
  };

  const calculateResult = (str: string) => {
    return eval(str.replace('=', ''));
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  return (
    <Card header="生成计算题">
      <div>
        <div>
          <Form
            layout="inline"
            form={form}
            initialValues={{ count: 120, answerRange: 20, operations: ['+'] }}
            onFinish={onSubmit}
          >
            <Form.Item label="数量" name="count" rules={[{ required: true, message: '请选择数量' }]}>
              <Radio.Group>
                <Radio value={40}>40</Radio>
                <Radio value={60}>60</Radio>
                <Radio value={80}>80</Radio>
                <Radio value={120}>120</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="范围" name="answerRange" rules={[{ required: true, message: '请输入范围' }]}>
              <InputNumber min={1}></InputNumber>
            </Form.Item>
            <Form.Item label="运算方式" name="operations" rules={[{ required: true, message: '请选择运算方式' }]}>
              <Checkbox.Group
                options={[
                  {
                    value: '+',
                    label: '加法',
                  },
                  {
                    value: '-',
                    label: '减法',
                  },
                  // {
                  //   value: '×',
                  //   label: '乘法',
                  // },
                  // {
                  //   value:  '÷',
                  //   label: '除法',
                  // },
                ]}
              ></Checkbox.Group>
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={loading}>
              生成
            </Button>
            <Button onClick={printArea} style={{ marginLeft: 10 }} disabled={loading}>
              打印
            </Button>
            <Button onClick={save} style={{ marginLeft: 10 }} disabled={loading}>
              保存
            </Button>
          </Form>
        </div>
        <div>
          <Checkbox checked={showAnswer} onChange={(e) => setShowAnswer(e.target.checked)}>
            显示答案
          </Checkbox>
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
          {list.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', height: '100%' }}>
              {list.map((item, index) => (
                <div key={index} className={styles.printItem} style={{ width: '33%', fontSize: 16 }}>
                  <span style={{ color: '#ccc', fontSize: 12 }}>{index + 1}、</span>
                  <span>
                    {item}
                    {showAnswer && <span style={{ color: 'blue', marginLeft: 4 }}>{calculateResult(item)}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40 }}>
              <Empty description="请先选择生成参数" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GenerateCalculator;
