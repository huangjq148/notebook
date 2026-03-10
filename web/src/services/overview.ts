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

export const getCoreMetrics = async (conditions = {}) => {
  return request('/overview/core-metrics', {
    method: 'GET',
    params: conditions,
  });
};

export const getSalesDistribution = async (conditions = {}) => {
  return request('/overview/sales-distribution', {
    method: 'GET',
    params: conditions,
  });
};

export const getProfitTrend = async (conditions = {}) => {
  return request('/overview/profit/trend', {
    method: 'GET',
    params: conditions,
  });
};
