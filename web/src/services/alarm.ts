import { request } from '@/utils';

export const createAlarm = (data: {
  title: string;
  description: string;
}): Promise<{ status: string; access_token: string }> => {
  return request('/alarm', {
    method: 'POST',
    data,
  });
};

export const queryAlarmList = (params: {}): Promise<{ status: string; access_token: string }> => {
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
