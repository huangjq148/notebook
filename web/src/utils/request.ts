import { message } from 'antd';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { getAccessToken } from './auth';

// AxiosRequestConfig 拓展
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    skipAuth?: boolean;
}

// axios 配置及拦截器
axios.defaults.timeout = 30000;

// 指定请求地址

axios.defaults.baseURL = process.env.NODE_ENV === 'development' ? "/api" : '';

// 添加请求拦截器
axios.interceptors.request.use(
    async (config: CustomAxiosRequestConfig) => {
        // 没有刷新token或接口本身无需用户验证
        if (config?.skipAuth) return config;
        const token = getAccessToken();
        // 获取用户token，用于校验
        if (token) {
            // @ts-ignore
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 指定 axios 请求类型
        // @ts-ignore
        config.headers['Content-Type'] = 'application/json;charset=utf-8';

        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// 添加响应拦截器，拦截登录过期或者没有权限

axios.interceptors.response.use(
    (response: AxiosResponse<any>) => {
        if (response.data.status === "success") {
            return Promise.resolve(response.data);
        }

        message.error(response.data.message)
        return Promise.reject(new Error(response.data.message));
    },
    async (error: AxiosError) => {

        return Promise.reject(error?.response?.data || error);
    },
);

// 统一发起请求的函数, 暂时只用来 mock
export default function request<T>(url: string, options?: AxiosRequestConfig) {
    if (options) {
        options.url = url;
    } else {
        options = { url };
    }

    return axios.request<T>(options).then((res) => res.data);
}
