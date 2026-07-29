# Order Excel Export Feature Design

## Overview

Add an "Export to Excel" button on the order list page that exports currently selected rows (checkboxes) to an `.xlsx` file. The export is purely frontend-side, no backend changes required.

## Columns

| Column | Data Source | Notes |
|--------|------------|-------|
| 品名 | `order.name` | Product name |
| 日期 | `order.orderTime` | Formatted as `YYYY-MM-DD` |
| 单价 | `order.sellPrice` | Unit selling price |
| 数量 | `order.number` | Quantity |
| 总金额 | `sellPrice × number` | Calculated, not stored |

## Last Row

A summary row at the bottom with:
- 品名 = `"汇总"`
- 总金额 = sum of all selected rows' `sellPrice × number`
- Other columns left blank

## Implementation

### Frontend

1. **Install dependency**: `xlsx` (SheetJS) — pure JS Excel generation, no backend dependency.

2. **Modify page** `web/src/pages/order/index.tsx`:
   - Add `"导出 Excel"` button alongside existing `"复制"` button.
   - Add `handleExportExcel` function that:
     - Gets selected rows from `rowSelection.onChange` (already stored via `setSelectDataStr` pattern, but we need raw selected rows).
     - Build sheet data: map each row to `[name, date, sellPrice, number, sellPrice * number]`.
     - Append summary row: `['汇总', '', '', '', totalSum]`.
     - Use `xlsx.utils.aoa_to_sheet` to create sheet, `xlsx.utils.book_new` / `xlsx.utils.book_append_sheet` to build workbook, `xlsx.writeFile` to download.

3. **Component state**: Add a new state `selectedRows: Order[]` to store the currently selected rows for use by the export button. (Currently `selectedDataStr` stores a formatted string for copy, not the raw rows).

### Dependencies

- `xlsx` (^0.18.5) — npm package for Excel file generation.

### Files Changed

- `web/package.json` — add `xlsx` dependency.
- `web/src/pages/order/index.tsx` — add export button and handler.

### Error Handling

- If no rows are selected, show a warning message (same pattern as copy: `message.warning('请先选择要导出的数据')`).

## Not In Scope

- Backend API changes (not needed).
- Pagination-aware full export (only exports currently selected rows on the current page).
- Custom formatting (font, borders, colors) — basic plain Excel output.
