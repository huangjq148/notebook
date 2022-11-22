import create from 'zustand';
import { message } from "antd"
import { fetchUserInfo } from "@/services/user"

export interface UserInfoModel {
    /** 用户信息 */
    userInfo: UserInfo;
    /** 获取用户信息 */
    getUserInfo: () => Promise<void>;
    /** 更新用户信息 */
    updateUserInfo: (params: UserInfo) => Promise<void>;
}

export default create(
    (set: (params: Partial<UserInfoModel>) => void, get: () => Required<UserInfoModel>): UserInfoModel => ({
        userInfo: {
            Id: "",
            Name: '-',
        },

        getUserInfo: async () => {
            const userInfo = await fetchUserInfo();
            set({ userInfo })
        },

        updateUserInfo: async (params: UserInfo) => {
            console.log(params);
            message.success("保存成功")
        },
    }),
);
