import request from '@/utils/request';

export const fetchUserInfo = async (): Promise<UserInfo> => {
  return request(`/user/info`, {
    method: 'GET',
  });
};

export const fetchUserList = async (): Promise<UserInfo[]> => {
  return request(`/user`, {
    method: 'GET',
  });
};
