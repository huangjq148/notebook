import request from '@/utils/request';

// 定义StudentWork接口
export interface Calculator {
  id?: number;
  content: string;
  count: string;
  operations: string;
  answerRange: string;
}

export const getCalculatorList = async (): Promise<void> => {
  return request(`/calculator`, {
    method: 'GET',
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
    method: 'PUT',
    data,
  });
};

export const deleteCalculator = async (id: number): Promise<void> => {
  return request(`/calculator/${id}`, {
    method: 'DELETE',
  });
};
