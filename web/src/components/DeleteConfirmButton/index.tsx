import React from "react";
import { Popconfirm } from "antd";

export type DeleteConfirmButtonProps = {
  onConfirm: () => void;
  children: React.ReactNode;
};

const DeleteConfirmButton: React.FC<DeleteConfirmButtonProps> = (props) => {
  return (
    <Popconfirm
      placement="topLeft"
      title="确定删除当前数据"
      onConfirm={() => {
        props.onConfirm();
      }}
      okText="是的"
      cancelText="点错了"
    >
      {props.children}
    </Popconfirm>
  );
};

export default DeleteConfirmButton;
