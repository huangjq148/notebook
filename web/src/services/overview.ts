import request from '@/utils/request';

export interface OverviewRange {
  startTime: string;
  endTime: string;
}

export interface CoreMetricsData {
  totalSales: number;
  totalProfit: number;
  orderCount: number;
  avgProfitRate: number;
  salesMoM: number | null;
  profitMoM: number | null;
  orderCountMoM: number | null;
  avgProfitRateMoM: number | null;
  previousStart: string;
  previousEnd: string;
}

export interface RankingItem {
  name: string;
  money: number;
}
export interface OverviewRankings {
  top5BuyGoods: RankingItem[];
  top5SellGoods: RankingItem[];
  top5ProfitGoods: RankingItem[];
  top5BuyCustomer: RankingItem[];
}
export interface ProfitTrendItem {
  date: string;
  current: number;
  compare: number;
  compareLabel: string;
}

export const getTop5Data = (params: OverviewRange) => request<OverviewRankings>('/overview', { method: 'GET', params });

export const getCoreMetrics = (params: OverviewRange) =>
  request<CoreMetricsData>('/overview/core-metrics', { method: 'GET', params });

export const getProfitTrend = (params: OverviewRange) =>
  request<ProfitTrendItem[]>('/overview/profit/trend', { method: 'GET', params });
