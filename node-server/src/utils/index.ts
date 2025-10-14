export type QueryResult<T> = {
  data:
    | T
    | {
        content?: T[];
        total?: number;
      };
  message: string;
  status: string;
};

export class ResponseResult {
  static page<T>(queryResult: [result: T[], total: number]): QueryResult<T> {
    const [data, total] = queryResult;
    return {
      data: {
        content: data,
        total: total,
      },
      message: '查询成功',
      status: 'success',
    };
  }
  static success<I>(data: I, message?: string): QueryResult<I> {
    return {
      data,
      message: message || '查询成功',
      status: 'success',
    };
  }

  static error(message: string): QueryResult<any> {
    return {
      data: {},
      message,
      status: 'error',
    };
  }
}
