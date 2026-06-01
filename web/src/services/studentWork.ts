import request from '@/utils/request';
import type { PagedResult } from '@/hooks/useTable';

// 定义StudentWork接口
export interface StudentWork {
  id?: number;
  date: string;
  content: string;
}

export const getStudentWorkList = async (params: Record<string, unknown>): Promise<PagedResult<StudentWork>> => {
  return request(`/student-work`, {
    method: 'GET',
    params,
  });
};

export const queryStudentWorkById = async (id: number): Promise<StudentWork> => {
  return request(`/student-work/${id}`, {
    method: 'GET',
  });
};

export const createStudentWork = async (data: StudentWork): Promise<void> => {
  return request(`/student-work`, {
    method: 'POST',
    data,
  });
};

export const updateStudentWork = async (data: StudentWork): Promise<void> => {
  return request(`/student-work/${data.id}`, {
    method: 'PATCH',
    data,
  });
};

export const deleteStudentWork = async (id: number): Promise<void> => {
  return request(`/student-work/${id}`, {
    method: 'DELETE',
  });
};
