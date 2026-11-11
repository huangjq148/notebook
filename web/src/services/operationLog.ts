import { request } from '@/utils';
import type { PagedResult } from '@/hooks/useTable';

// 操作日志（审计日志）记录
export type OperationLogRecord = {
  id?: number;
  // 操作人 ID（登录失败时为空）
  userId?: string;
  // 操作人用户名
  userName?: string;
  // 模块：order/product/contact/stock/alarm/user/system/auth...
  module?: string;
  // 动作：create/update/delete/login/logout/other
  action?: string;
  // 操作目标 ID
  targetId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  // 已脱敏的请求体 JSON
  reqBody?: string;
  // 改前快照 JSON（update/delete 才有）
  beforeData?: string;
  // 改后快照 JSON
  afterData?: string;
  statusCode?: number;
  // 1 成功 / 0 失败
  success?: number;
  errMsg?: string;
  costMs?: number;
  createTime?: string;
};

export type OperationLogOption = {
  value: string;
  label: string;
};

export type OperationLogOptions = {
  module: OperationLogOption[];
  action: OperationLogOption[];
};

// 分页查询操作日志
export const queryOperationLogList = (params: Record<string, unknown>): Promise<PagedResult<OperationLogRecord>> => {
  return request('/operation-log', {
    method: 'GET',
    params,
  });
};

// 查询单条详情（含改前/改后完整 JSON）
export const getOperationLogDetail = (id: number): Promise<OperationLogRecord> => {
  return request(`/operation-log/${id}`, {
    method: 'GET',
  });
};

// 查询模块 / 动作枚举
export const queryOperationLogOptions = (): Promise<OperationLogOptions> => {
  return request('/operation-log/options', {
    method: 'GET',
  });
};
