import { SearchForm, Table, TableColumnType, TextButton } from '@/components';
import { useTable } from '@/hooks';
import {
  queryOperationLogList,
  queryOperationLogOptions,
  type OperationLogOption,
  type OperationLogRecord,
} from '@/services/operationLog';
import { Button, DatePicker, Input, Select, Space, Tag } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import OperationLogDetailDrawer from './DetailDrawer';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

type DraftFilters = {
  module?: string;
  action?: string;
  keyword?: string;
  range?: [Dayjs, Dayjs] | null;
};

// 把筛选草稿转成后端查询参数（空值不传）
const buildConditions = (draft: DraftFilters): Record<string, unknown> => {
  const conditions: Record<string, unknown> = {};

  if (draft.module) {
    conditions.module = draft.module;
  }
  if (draft.action) {
    conditions.action = draft.action;
  }
  if (draft.keyword?.trim()) {
    conditions.keyword = draft.keyword.trim();
  }
  if (draft.range?.[0] && draft.range?.[1]) {
    conditions.startTime = dayjs(draft.range[0]).format('YYYY-MM-DD HH:mm:ss');
    conditions.endTime = dayjs(draft.range[1]).format('YYYY-MM-DD HH:mm:ss');
  }

  return conditions;
};

const OperationLog = () => {
  const [moduleOptions, setModuleOptions] = useState<OperationLogOption[]>([]);
  const [actionOptions, setActionOptions] = useState<OperationLogOption[]>([]);
  const [draft, setDraft] = useState<DraftFilters>({});
  const [conditions, setConditions] = useState<Record<string, unknown>>({});
  const [detailId, setDetailId] = useState<number>();
  const [detailOpen, setDetailOpen] = useState(false);

  const { tableOptions, searchForm, pagination } = useTable<OperationLogRecord>({
    request: queryOperationLogList,
    conditions,
    defaultPageSize: 20,
  });

  // 模块 / 动作枚举来自后端，避免前后端各写一份
  useEffect(() => {
    queryOperationLogOptions()
      .then((options) => {
        setModuleOptions(options?.module ?? []);
        setActionOptions(options?.action ?? []);
      })
      .catch(() => {
        // 枚举拉取失败不影响列表查询，错误提示由全局拦截器处理
      });
  }, []);

  const labelMaps = useMemo(() => {
    const moduleMap: Record<string, string> = {};
    const actionMap: Record<string, string> = {};
    moduleOptions.forEach((item) => {
      moduleMap[item.value] = item.label;
    });
    actionOptions.forEach((item) => {
      actionMap[item.value] = item.label;
    });
    return { moduleMap, actionMap };
  }, [moduleOptions, actionOptions]);

  const handleSearch = () => {
    setConditions(buildConditions(draft));
    // conditions 变化会自动触发查询；如果当前不在第一页，这里顺带回到第一页
    if (pagination.current !== 1) {
      searchForm();
    }
  };

  const handleReset = () => {
    setDraft({});
    setConditions({});
    if (pagination.current !== 1) {
      searchForm();
    }
  };

  const handleOpenDetail = (record: OperationLogRecord) => {
    if (!record.id) {
      return;
    }
    setDetailId(record.id);
    setDetailOpen(true);
  };

  const columns: TableColumnType[] = [
    {
      title: '时间',
      dataIndex: 'createTime',
      dataType: 'date',
      width: 170,
    },
    {
      title: '操作人',
      dataIndex: 'userName',
      width: 140,
      render: (value: string, record: OperationLogRecord) => value || record.userId || '-',
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 110,
      render: (value: string) => labelMaps.moduleMap[value] || value || '-',
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      render: (value: string) => labelMaps.actionMap[value] || value || '-',
    },
    {
      title: '目标 ID',
      dataIndex: 'targetId',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: '结果',
      dataIndex: 'success',
      width: 90,
      render: (value: number) =>
        value === 1 ? (
          <Tag color="success">成功</Tag>
        ) : (
          <Tag color="error">失败</Tag>
        ),
    },
    {
      title: '耗时',
      dataIndex: 'costMs',
      width: 90,
      render: (value: number) => (value == null ? '-' : `${value} ms`),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'operation',
      width: 90,
      render: (_: unknown, record: OperationLogRecord) => (
        <TextButton onClick={() => handleOpenDetail(record)}>详情</TextButton>
      ),
    },
  ];

  return (
    <div>
      <SearchForm>
        <Space wrap size="middle">
          <Space size={8}>
            <span className={styles.filterLabel}>时间</span>
            <RangePicker
              showTime
              allowClear
              value={draft.range ?? null}
              placeholder={['开始时间', '结束时间']}
              style={{ width: 360 }}
              onChange={(dates) => {
                setDraft((prev) => ({ ...prev, range: (dates as [Dayjs, Dayjs] | null) ?? undefined }));
              }}
            />
          </Space>
          <Space size={8}>
            <span className={styles.filterLabel}>模块</span>
            <Select
              allowClear
              placeholder="全部模块"
              style={{ width: 150 }}
              value={draft.module}
              options={moduleOptions}
              onChange={(value) => setDraft((prev) => ({ ...prev, module: value }))}
            />
          </Space>
          <Space size={8}>
            <span className={styles.filterLabel}>动作</span>
            <Select
              allowClear
              placeholder="全部动作"
              style={{ width: 130 }}
              value={draft.action}
              options={actionOptions}
              onChange={(value) => setDraft((prev) => ({ ...prev, action: value }))}
            />
          </Space>
          <Input
            allowClear
            placeholder="操作人 / 目标 ID / 路径"
            style={{ width: 220 }}
            value={draft.keyword}
            onChange={(event) => setDraft((prev) => ({ ...prev, keyword: event.target.value }))}
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </SearchForm>

      <div className={styles.tableWrapper}>
        <Table<OperationLogRecord>
          rowKey="id"
          columns={columns}
          {...tableOptions}
          onRow={(record) => ({
            onClick: () => handleOpenDetail(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <OperationLogDetailDrawer
        open={detailOpen}
        id={detailId}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(undefined);
        }}
      />
    </div>
  );
};

export default OperationLog;
