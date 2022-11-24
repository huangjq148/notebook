import React, { useEffect, useState } from "react";
import { TablePaginationConfig } from "antd/es/table";

type Pagination = TablePaginationConfig;

export default <T>(props: { request: any; conditions: Record<string, any> }) => {
  const { request, conditions } = props;
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    pageSize: 10,
    current: 1,
    total: 30,
  });
  const [dataSource, setDataSource] = useState<T[]>([] as any);

  const loadData = async (params?: any) => {
    const { current, pageSize } = pagination;
    setLoading(true);
    const result = await request({ ...conditions, current, pageSize });
    setLoading(false);
    setDataSource(result);
  };

  const handlePageChange = (newPagination: Pagination) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, conditions]);

  return { dataSource, loading, searchForm: loadData, pagination, handlePageChange };
};
