import { Table, TableColumnType } from '@/components';
import { useTable } from '@/hooks';
import { queryOperationLogList, OperationLog } from '@/services/operationLog';

const columns: TableColumnType<OperationLog>[] = [
  { title: '用户', dataIndex: 'username', width: 140 },
  { title: '方法', dataIndex: 'method', width: 100 },
  { title: '请求路径', dataIndex: 'path', width: 320, ellipsis: true },
  { title: '状态码', dataIndex: 'statusCode', width: 100 },
  { title: 'IP 地址', dataIndex: 'ip', width: 160 },
  { title: '操作时间', dataIndex: 'createTime', dataType: 'date', width: 180 },
];

const OperationLogPage = () => {
  const { tableOptions } = useTable<OperationLog>({
    request: queryOperationLogList,
    conditions: {},
  });

  return <Table rowKey="id" columns={columns} {...tableOptions} />;
};

export default OperationLogPage;
