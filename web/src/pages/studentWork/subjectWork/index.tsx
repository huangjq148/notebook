import { Card } from '@/components';
import { queryStudentWorkById, updateStudentWork } from '@/services/studentWork';
import { DeleteOutlined, InboxOutlined, PlusCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  List,
  message,
  Modal,
  Space,
  Switch,
  Transfer,
  Upload,
  UploadProps,
} from 'antd';
import type { Key } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Dragger } = Upload;

const SUBJECTS = ['语文', '数学', '英语'];

type Content = {
  content: string;
  completed: boolean;
};

const uploadProps: UploadProps = {
  name: 'file',
  multiple: true,
  action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
  onChange(info) {
    const { status } = info.file;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};

const SubjectWork = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [targetKeys, setTargetKeys] = useState<Key[]>([]);
  const [dataSource, setDataSource] = useState<Record<string, Content[]>>({});
  const [modalOption, setModalOption] = useState({
    open: false,
    subject: '',
    title: '',
  });
  const [form] = Form.useForm();
  const { id } = useParams();
  const [data, setData] = useState<any>({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const subjects = useMemo(() => {
    return Object.keys(dataSource);
  }, [dataSource]);

  // 打开弹框时，初始化已选择的学科
  const showModal = () => {
    setTargetKeys(subjects);
    setModalVisible(true);
  };

  // 确认选择
  const handleOk = () => {
    const newDataSource: any = {};
    targetKeys.map((item) => {
      const key = item as string;
      if (dataSource[key]) {
        newDataSource[key] = dataSource[key];
      } else {
        newDataSource[key] = [];
      }
    });
    setDataSource(newDataSource);
    setModalVisible(false);
  };

  // 取消选择
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 处理穿梭框选择变化
  const handleChange = (nextTargetKeys: Key[]) => {
    setTargetKeys(nextTargetKeys);
  };

  // 处理选中项变化
  const handleSelectChange = (sourceSelectedKeys: Key[], targetSelectedKeys: Key[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const handleSaveClick = async () => {
    try {
      setLoading(true);
      await updateStudentWork({
        id,
        ...data,
        content: JSON.stringify(dataSource),
      });
      message.success('保存成功');
      navigate('/student-work/list');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await queryStudentWorkById(Number(id));
      const content = JSON.parse(res.content || '[]');
      setDataSource(content);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  return (
    <>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <h1>学科作业</h1>
            <Button type="primary" onClick={showModal} loading={loading}>
              学科配置
            </Button>
            <Button type="primary" onClick={handleSaveClick} loading={loading}>
              保存
            </Button>
          </Space>

          {subjects.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <h3>已选择的学科：</h3>
              {subjects.map((subject) => {
                return subject ? (
                  <List
                    header={
                      <Space>
                        <span>{subject}作业</span>{' '}
                        <PlusCircleOutlined
                          onClick={() => {
                            form.setFieldsValue({
                              content: '',
                              completed: false,
                              image: '',
                            });
                            setModalOption({
                              open: true,
                              subject: subject,
                              title: `${subject}作业`,
                            });
                          }}
                        />
                      </Space>
                    }
                    dataSource={dataSource[subject]}
                    renderItem={(item) => (
                      <List.Item key={item.content}>
                        <Space>
                          <Checkbox
                            checked={item.completed}
                            onChange={(e) => {
                              const newDataSource = { ...dataSource };
                              newDataSource[subject] = newDataSource[subject].map((i) => {
                                if (i.content === item.content) {
                                  return { ...i, completed: e.target.checked };
                                }
                                return i;
                              });
                              setDataSource(newDataSource);
                            }}
                          >
                            {item.content}
                          </Checkbox>

                          <DeleteOutlined
                            onClick={() => {
                              const newDataSource = { ...dataSource };
                              newDataSource[subject] = newDataSource[subject].filter((i) => i.content !== item.content);
                              setDataSource(newDataSource);
                            }}
                          />
                        </Space>
                      </List.Item>
                    )}
                  ></List>
                ) : null;
              })}
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <p>请点击&quot;学科配置&quot;按钮选择要显示的学科</p>
            </div>
          )}
        </Space>
      </Card>

      <Modal
        title={modalOption.title}
        open={modalOption.open}
        onCancel={() => setModalOption({ ...modalOption, open: false })}
        onOk={form.submit}
      >
        <Form
          onFinish={() => {
            const values = form.getFieldsValue();
            const newDataSource = { ...dataSource };
            newDataSource[modalOption.subject] = [...(newDataSource[modalOption.subject] || []), values];
            setDataSource(newDataSource);
            setModalOption({ ...modalOption, open: false });
          }}
          form={form}
        >
          <Form.Item label="作业内容" name="content" rules={[{ required: true, message: '请输入作业内容' }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="完成状态" valuePropName="checked" name="completed" rules={[{ required: true }]}>
            <Switch />
          </Form.Item>
          <Form.Item label="作业图片" name="image">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持单个或批量上传。严禁上传公司数据或其他禁止的文件。</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="学科配置" open={modalVisible} onOk={handleOk} onCancel={handleCancel} width={600}>
        <Transfer
          dataSource={SUBJECTS.map((item) => ({
            key: item,
            title: item,
          }))}
          titles={['可选学科', '已选学科']}
          targetKeys={targetKeys}
          selectedKeys={selectedKeys}
          onChange={handleChange}
          onSelectChange={handleSelectChange}
          render={(item) => item.title}
          listStyle={{
            width: 250,
            height: 300,
          }}
        />
      </Modal>
    </>
  );
};

export default SubjectWork;
