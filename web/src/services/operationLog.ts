import { request } from '@/utils';

export type OperationLog = Record<string, any> & {
  id: number;
  username: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  createTime: string;
};

type OperationLogQueryParams = Record<string, unknown> & {
  current?: number;
  pageSize?: number;
};

export const queryOperationLogList = (params: OperationLogQueryParams): Promise<{ content: OperationLog[]; total: number }> => {
  return request<{ content: OperationLog[]; total: number }>('/operation-log', {
    method: 'GET',
    params,
  });
};
