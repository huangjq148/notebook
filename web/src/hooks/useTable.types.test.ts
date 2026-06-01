import type { PagedResult, UseTableRequest } from './useTable';

type Row = {
  id: number;
  name: string;
};

const request: UseTableRequest<Row> = async (params) => {
  params.current;
  params.pageSize;

  return {
    content: [{ id: 1, name: 'row' }],
    total: 1,
  };
};

const emptyResult: PagedResult<Row> = {};

void request;
void emptyResult;
