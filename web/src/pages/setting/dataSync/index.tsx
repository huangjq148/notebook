import { Card } from '@/components';
import { exportData, importData, sendDataSyncMail } from '@/services/system';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  FileExcelOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Input, Alert, message, Modal, Tag, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import styles from './index.module.less';
import MailSettingDrawer from './MailSettingDrawer';

const { Paragraph, Text } = Typography;

// 整库导入为覆盖式恢复，需要手动输入该文字才能确认
const RESTORE_CONFIRM_TEXT = '覆盖恢复';

const DataSync = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportData();

      // 后端出错时会返回 json 而不是 csv
      if (blob.type.includes('application/json')) {
        const result = JSON.parse(await blob.text());
        throw new Error(result?.message || '导出失败');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `数据同步_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleSendMail = async () => {
    setSending(true);
    try {
      await sendDataSyncMail();
      message.success('已发送到邮箱');
    } catch (error: any) {
      message.error(error?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleImport = (file: File) => {
    setConfirmText('');
    setImportFile(file);
    return Upload.LIST_IGNORE;
  };

  const closeImportModal = () => {
    if (importing) return;
    setImportFile(null);
    setConfirmText('');
  };

  const handleConfirmImport = async () => {
    if (!importFile || confirmText !== RESTORE_CONFIRM_TEXT) return;

    setImporting(true);
    try {
      const result = await importData(importFile);
      message.success(
        `导入成功：商品 ${result.product} 条，库存 ${result.stock} 条，联系人 ${result.contact} 条，订单 ${result.order} 条`,
      );
      setImportFile(null);
      setConfirmText('');
    } catch (error: any) {
      message.error(error?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card
      header={
        <>
          <SyncOutlined />
          数据同步
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            style={{ marginLeft: 'auto' }}
            onClick={() => setSettingOpen(true)}
          >
            邮箱备份设置
          </Button>
        </>
      }
    >
      <MailSettingDrawer open={settingOpen} onClose={() => setSettingOpen(false)} />
      <Modal
        title={
          <>
            <SafetyCertificateOutlined style={{ color: 'var(--color-error)', marginRight: 8 }} />
            确认恢复整个数据库？
          </>
        }
        open={!!importFile}
        onCancel={closeImportModal}
        onOk={handleConfirmImport}
        okText="确认恢复"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: confirmText !== RESTORE_CONFIRM_TEXT }}
        confirmLoading={importing}
        maskClosable={!importing}
        destroyOnClose
      >
        <Alert
          type="error"
          showIcon
          message="此操作不可撤销"
          description="导入会清空并覆盖整库的商品、库存、联系人和订单数据，请确认已提前导出备份。"
          style={{ marginBottom: 16 }}
        />
        <Paragraph>
          文件：<Text strong>{importFile?.name}</Text>
        </Paragraph>
        <Paragraph>
          请输入 <Text code>{RESTORE_CONFIRM_TEXT}</Text> 以确认：
        </Paragraph>
        <Input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder={RESTORE_CONFIRM_TEXT}
          onPressEnter={() => {
            if (confirmText === RESTORE_CONFIRM_TEXT) {
              handleConfirmImport();
            }
          }}
          allowClear
        />
      </Modal>
      <Paragraph type="secondary" className={styles.tip}>
        将整个数据库的商品、库存、联系人和订单数据导出为一个 CSV 文件进行备份，也可以选择之前导出的 CSV 文件恢复数据。
      </Paragraph>

      <div className={styles.grid}>
        <div className={styles.block}>
          <div className={styles.iconWrapper}>
            <CloudDownloadOutlined className={styles.icon} />
          </div>
          <h3 className={styles.title}>导出数据</h3>
          <Paragraph type="secondary" className={styles.desc}>
            把所有表格的数据导出到同一个 CSV 文件中，建议定期备份。
          </Paragraph>
          <div className={styles.tags}>
            <Tag color="blue">商品</Tag>
            <Tag color="blue">库存</Tag>
            <Tag color="blue">联系人</Tag>
            <Tag color="blue">订单</Tag>
          </div>
          <Button type="primary" icon={<FileExcelOutlined />} loading={exporting} onClick={handleExport} block>
            导出 CSV
          </Button>
          <Button
            className={styles.mailButton}
            icon={<MailOutlined />}
            loading={sending}
            onClick={handleSendMail}
            block
          >
            发送到邮箱
          </Button>
        </div>

        <div className={styles.block}>
          <div className={styles.iconWrapper}>
            <CloudUploadOutlined className={styles.icon} />
          </div>
          <h3 className={styles.title}>导入数据</h3>
          <Paragraph type="secondary" className={styles.desc}>
            选择之前导出的 CSV 文件导入，导入会覆盖整库对应的数据。
          </Paragraph>
          <div className={styles.tags}>
            <Text type="warning">导入前请先备份当前数据</Text>
          </div>
          <Upload accept=".csv" showUploadList={false} beforeUpload={handleImport} disabled={importing}>
            <Button icon={<DatabaseOutlined />} loading={importing} block>
              导入 CSV
            </Button>
          </Upload>
        </div>
      </div>
    </Card>
  );
};

export default DataSync;
