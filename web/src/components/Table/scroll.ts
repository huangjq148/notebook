import type { TableProps } from 'antd';

export const DEFAULT_TABLE_SCROLL: NonNullable<TableProps['scroll']> = {
  x: 'max-content',
  // Reserve space for the app header, search panels, and table card padding.
  y: 'calc(100vh - 460px)',
};
