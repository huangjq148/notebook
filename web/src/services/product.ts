import { Product } from '@/global';
import type { PagedResult } from '@/hooks/useTable';
import request from '@/utils/request';

export const createProduct = async (data: Product): Promise<Product> => {
  return request(`/product`, {
    method: 'POST',
    data,
  });
};

export const queryProduct = async (conditions: Record<string, unknown>): Promise<PagedResult<Product>> => {
  return request(`/product`, {
    method: 'GET',
    params: conditions,
  });
};

export const queryProductById = async (id: number): Promise<Product> => {
  return request(`/product/${id}`, {
    method: 'GET',
  });
};

export const updateProduct = async (data: Product): Promise<void> => {
  return request(`/product/${data.id}`, {
    method: 'PATCH',
    data,
  });
};

export const deleteProduct = async (id: number): Promise<Product[]> => {
  return request(`/product/${id}`, {
    method: 'DELETE',
  });
};
