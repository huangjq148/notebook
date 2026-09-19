import request from '@/utils/request';
import { getAccessToken } from '@/utils';
import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'development' ? '/api' : '/server';

// 导入导出涉及文件流和 FormData，统一 request 会把 Content-Type 固定为 json，
// 这里单独创建一个实例，只复用 token。
const fileRequest = axios.create({ baseURL });

fileRequest.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

fileRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const data = error?.response?.data;

    // 导出接口使用 blob，出错时后端返回的其实是 json
    if (data instanceof Blob) {
      try {
        const result = JSON.parse(await data.text());
        error.message = result?.message || error.message;
      } catch {
        // 忽略解析失败
      }
    }

    if (error?.response?.status === 401 && location.pathname !== '/login') {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export const transferData = async (data: any): Promise<void> => {
  return request(`/system/data/transfer`, {
    method: 'POST',
    data,
  });
};

export interface ImportResult {
  product: number;
  stock: number;
  contact: number;
  order: number;
}

// 导出当前账号的全部业务数据（商品 / 库存 / 联系人 / 订单）为一个 csv 文件
export const exportData = async (): Promise<Blob> => {
  const response = await fileRequest.get(`/system/data/export`, {
    responseType: 'blob',
  });
  return response.data;
};

// 将导出的 csv 文件导入数据库
export const importData = async (file: File): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fileRequest.post(`/system/data/import`, formData);
  const result = response.data;

  if (result?.status !== 'success') {
    throw new Error(result?.message || '导入失败');
  }

  return result.data as ImportResult;
};

// 立即将当前账号的数据备份发送到配置的邮箱
export const sendDataSyncMail = async (): Promise<void> => {
  return request(`/system/data/mail`, {
    method: 'POST',
  });
};

export interface DataSyncMailConfig {
  id?: number;
  // "1" 开启 / "0" 关闭
  isEnable: string;
  mailUsername: string;
  mailFrom: string;
  mailTo: string;
  mailHost: string;
  mailPort: string;
  sendHour: number;
  // 保存时传入；为空表示不修改已保存的授权码
  mailAuthCode?: string;
  // 是否已保存过授权码
  hasAuthCode?: boolean;
}

// 获取数据同步邮件配置（授权码不会返回）
export const fetchDataSyncMailConfig = async (): Promise<DataSyncMailConfig> => {
  return request(`/system/data/mail/config`, {
    method: 'GET',
  });
};

// 保存数据同步邮件配置（mailAuthCode 为空表示不修改）
export const saveDataSyncMailConfig = async (data: DataSyncMailConfig): Promise<void> => {
  return request(`/system/data/mail/config`, {
    method: 'PUT',
    data,
  });
};
