import request from '@/utils/request';
import type { PagedResult } from '@/hooks/useTable';

// 定义StudentWork接口
export interface Calculator {
  id?: number;
  content: string;
  count: string;
  operations: string;
  answerRange: string;
}

export const getCalculatorList = async (params: Record<string, unknown>): Promise<PagedResult<Calculator>> => {
  return request(`/calculator`, {
    method: 'GET',
    params,
  });
};

export const queryCalculatorById = async (id: number): Promise<Calculator> => {
  return request(`/calculator/${id}`, {
    method: 'GET',
  });
};

export const createCalculator = async (data: Calculator): Promise<void> => {
  return request(`/calculator`, {
    method: 'POST',
    data,
  });
};

export const updateCalculator = async (data: Calculator): Promise<void> => {
  return request(`/calculator/${data.id}`, {
    method: 'PATCH',
    data,
  });
};

export const deleteCalculator = async (id: number): Promise<void> => {
  return request(`/calculator/${id}`, {
    method: 'DELETE',
  });
};
