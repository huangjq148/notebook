import { transferData } from '@/services/system';
import { fetchUserList } from '@/services/user';
import { Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  dataIds: React.Key[];
  type: 'order' | 'stock' | 'contact';
};

const TargetUserSelectModal = (props: Props) => {
  const { open, onCancel, onOk, dataIds, type } = props;
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [users, setUsers] = useState<{}[]>([]);

  const handleTransferData = async () => {
    await transferData({
      type,
      dataIds,
      userId: targetUserId,
    });
    onOk();
  };

  const loadData = () => {
    fetchUserList().then((res) => {
      setUsers(
        res.map((item) => ({
          value: item.id,
          label: item.name,
        })),
      );
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Modal open={open} title="数据移交" destroyOnClose onCancel={onCancel} onOk={() => handleTransferData()}>
      数据移交给：
      <Select
        style={{
          width: 200,
        }}
        options={users}
        onChange={setTargetUserId}
      />
    </Modal>
  );
};

export default TargetUserSelectModal;
