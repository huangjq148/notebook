import create from 'zustand';
import { message } from 'antd';
import { fetchUserInfo } from '@/services/user';
import { removeToken } from '@/utils';
import { UserInfo } from '@/global';

export interface UserInfoModel {
  /** 用户信息 */
  userInfo: UserInfo;
  /** 当前账号角色 */
  roles: string[];
  /** 保存当前账号角色 */
  setRoles: (roles: string[]) => void;
  /** 获取用户信息 */
  getUserInfo: () => Promise<void>;
  /** 更新用户信息 */
  updateUserInfo: (params: UserInfo) => Promise<void>;
  /** 登出 */
  logout: () => void;
}

const rolesStorageKey = 'user-roles';

const getStoredRoles = (): string[] => {
  try {
    const storedRoles = localStorage.getItem(rolesStorageKey);
    const parsed = storedRoles ? JSON.parse(storedRoles) : [];
    return Array.isArray(parsed) ? parsed.filter((role): role is string => typeof role === 'string') : [];
  } catch {
    return [];
  }
};

export default create(
  (set: (params: Partial<UserInfoModel>) => void, get: () => Required<UserInfoModel>): UserInfoModel => ({
    userInfo: {
      id: '',
      realname: '-',
      createUser: '',
      updateUser: '',
      createTime: '',
      updateTime: '',
    },
    roles: getStoredRoles(),

    setRoles: (roles: string[]) => {
      const normalizedRoles = [...new Set(roles.map((role) => role.trim()).filter(Boolean))];
      localStorage.setItem(rolesStorageKey, JSON.stringify(normalizedRoles));
      set({ roles: normalizedRoles });
    },

    getUserInfo: async () => {
      const userInfo = await fetchUserInfo();
      set({
        userInfo,
      });
    },

    updateUserInfo: async (params: UserInfo) => {
      message.success('保存成功');
    },

    logout: () => {
      removeToken();
      localStorage.removeItem(rolesStorageKey);
      window.location.reload();
    },
  }),
);
