import request from '@/utils/request';

export const getTop5Data = async (conditions = {}) => {
  return request('/overview', {
    method: 'GET',
    params: conditions,
  });
};

export const getProfitStatistics = async (conditions = {}) => {
  return request('/overview/profit/statistics', {
    method: 'GET',
    params: conditions,
  });
};
