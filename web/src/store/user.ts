import create from 'zustand';
import { message } from 'antd';
import { fetchUserInfo } from '@/services/user';
import { getRoles, parseRoles, removeToken, setRoles as persistRoles } from '@/utils';
import { UserInfo } from '@/global';

export interface UserInfoModel {
  /** 用户信息 */
  userInfo: UserInfo;
  /** 当前登录用户的角色（如 ['admin','user']），与 token 同生命周期 */
  roles: string[];
  /** 登录成功后写入角色（同时持久化，刷新页面不丢） */
  setRoles: (raw?: string | null) => void;
  /** 获取用户信息 */
  getUserInfo: () => Promise<void>;
  /** 更新用户信息 */
  updateUserInfo: (params: UserInfo) => Promise<void>;
  /** 登出 */
  logout: () => void;
}

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

    // 刷新页面后从 localStorage 恢复，保证菜单与路由守卫判断一致
    roles: getRoles(),

    setRoles: (raw?: string | null) => {
      persistRoles(raw);
      set({ roles: parseRoles(raw) });
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
      set({ roles: [] });
      window.location.reload();
    },
  }),
);
