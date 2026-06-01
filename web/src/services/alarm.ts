import { request } from '@/utils';
import type { PagedResult } from '@/hooks/useTable';

export type AlarmRecord = {
  id?: number;
  title: string;
  description: string;
  isRepeat?: string;
  isEnable?: string;
  createTime?: string;
};

export const createAlarm = (data: {
  title: string;
  description: string;
}): Promise<{ status: string; access_token: string }> => {
  return request('/alarm', {
    method: 'POST',
    data,
  });
};

export const queryAlarmList = (params: Record<string, unknown>): Promise<PagedResult<AlarmRecord>> => {
  return request('/alarm', {
    method: 'GET',
    params,
  });
};

export const deleteAlarm = (id: number): Promise<{ status: string }> => {
  return request(`/alarm/${id}`, {
    method: 'DELETE',
  });
};

// 发送消息到微信Webhook
export const sendMessageToWeChatWebhook = (params: { id: number }): Promise<{ status: string }> => {
  return request('/alarm/sendMessageToWeChatWebhook', {
    method: 'GET',
    params,
  });
};

export const updateAlarm = (id: number, data: {
  title: string;
  description: string;
}): Promise<{ status: string }> => {
  return request(`/alarm/${id}`, {
    method: 'PATCH',
    data,
  });
} 
