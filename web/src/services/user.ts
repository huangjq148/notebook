import { UserInfo } from '@/global';
import request from '@/utils/request';

export const fetchUserInfo = async (): Promise<UserInfo> => {
  return request(`/auth/profile`, {
    method: 'GET',
  });
};

export const fetchUserList = async (): Promise<UserInfo[]> => {
  return request(`/user`, {
    method: 'GET',
  });
};
