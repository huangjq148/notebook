import React, { useEffect, useState } from "react";
import { TablePaginationConfig } from "antd/es/table";
import { pickBy } from "lodash-es"

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
    const result = await request({ ...pickBy(conditions), current, pageSize });
    setLoading(false);
    setDataSource(result.content);
    setPagination(val => ({ ...val, total: result.total }))
  };

  const searchForm = () => {
    if (pagination.current !== 1) {
      setPagination(val => ({ ...val, current: 1 }))
    } else {
      loadData()
    }
  }

  const handlePageChange = (newPagination: Pagination) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, conditions]);

  return { dataSource, loading, searchForm, pagination, handlePageChange };
};
