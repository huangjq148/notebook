export type PageResult<T> = {
  data: {
    content: T[];
    total: number;
  };
  message: string;
  status: string;
};

export const toPageResult = <T>(
  queryResult: [result: T[], total: number],
): PageResult<T> => {
  const [data, total] = queryResult;
  return {
    data: {
      content: data,
      total,
    },
    message: '查询成功',
    status: 'success',
  };
};
