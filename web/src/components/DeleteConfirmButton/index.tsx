import React from 'react';
import { Popconfirm } from 'antd';

export type DeleteConfirmButtonProps = {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
};

const DeleteConfirmButton: React.FC<DeleteConfirmButtonProps> = (props) => {
  return (
    <Popconfirm
      placement="topLeft"
      title="确定删除这条数据吗？"
      onConfirm={props.onConfirm}
      okText="删除"
      cancelText="取消"
    >
      <span style={{ display: 'inline-flex' }}>{props.children}</span>
    </Popconfirm>
  );
};

export default DeleteConfirmButton;
