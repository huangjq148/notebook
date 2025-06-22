import { request } from '@/utils';

export const createAlarm = (data: {
  // username: string;
  // password: string;
}): Promise<{ status: string; access_token: string }> => {
  return request('/alarm', {
    method: 'GET',
    data,
  });
};
