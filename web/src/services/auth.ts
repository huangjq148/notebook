import { request } from '@/utils';

export const login = (data: {
  username: string;
  password: string;
}): Promise<{ status: string; access_token: string; roles?: string }> => {
  return request('/auth/login', {
    method: 'POST',
    data,
  });
};
