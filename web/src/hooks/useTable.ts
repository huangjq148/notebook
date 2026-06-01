import { useEffect, useRef, useState } from 'react';
import { TablePaginationConfig } from 'antd/es/table';
import { pickBy } from 'lodash-es';

type Pagination = TablePaginationConfig;
type QueryParams = Record<string, unknown> & {
  current?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  content?: T[];
  total?: number;
};

export type UseTableRequest<T> = (params: QueryParams) => Promise<PagedResult<T>>;

export default <T extends Record<string, any> = Record<string, any>>(props: {
  request: UseTableRequest<T>;
  conditions: Record<string, unknown>;
}) => {
  const { request, conditions } = props;
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    pageSize: 10,
    current: 1,
    total: 0,
    showSizeChanger: true,
  });
  const [dataSource, setDataSource] = useState<T[]>([] as T[]);
  const requestSeqRef = useRef(0);

  const loadData = async (params?: Record<string, unknown>) => {
    const { current, pageSize } = pagination;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoading(true);

    try {
      const result = (await request({
        ...pickBy({ ...conditions, ...(params ?? {}) }),
        current,
        pageSize,
      })) ?? {};

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setDataSource(Array.isArray(result.content) ? result.content : []);
      setPagination((val) => ({
        ...val,
        total: typeof result.total === 'number' ? result.total : (val.total ?? 0),
      }));
    } catch {
      // Errors are surfaced by the global request interceptor. Keep the last table data intact.
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const searchForm = () => {
    if (pagination.current !== 1) {
      setPagination((val) => ({
        ...val,
        current: 1,
      }));
    } else {
      loadData();
    }
  };

  const handlePageChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, conditions]);

  return {
    dataSource,
    loading,
    searchForm,
    pagination,
    handlePageChange,
    tableOptions: {
      dataSource,
      loading,
      pagination,
      onChange: handlePageChange,
    },
  };
};
