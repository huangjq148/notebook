# Order Excel Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Export to Excel" button on the order list page that exports selected rows to an `.xlsx` file.

**Architecture:** Purely frontend solution using `xlsx` (SheetJS) library. The selected rows data already exists in the component state via `rowSelection.onChange`. We add a new `selectedRows` state to hold the raw data, then use `xlsx.utils.aoa_to_sheet` to build the sheet and `xlsx.writeFile` to trigger download.

**Tech Stack:** React 19, TypeScript, Vite, Ant Design, xlsx (SheetJS)

---

### Task 1: Install xlsx dependency

**Files:**
- Modify: `web/package.json` — add `xlsx` dependency
- Modify: `web/pnpm-lock.yaml` — auto-updated by install

- [ ] **Step 1: Install xlsx**

```bash
cd /Volumes/project/notebook/web
pnpm add xlsx
```

Expected output: `+ xlsx x.x.x` and `package.json` updated.

- [ ] **Step 2: Commit**

```bash
cd /Volumes/project/notebook
git add web/package.json web/pnpm-lock.yaml
git commit -m "feat: add xlsx dependency for excel export"
```

---

### Task 2: Add selected rows state and export handler

**Files:**
- Modify: `web/src/pages/order/index.tsx` — add state, handler, button, and import

This task has two independent changes to the same file, performed sequentially.

- [ ] **Step 1: Add import for xlsx at the top of the file**

Find this existing import:
```typescript
import { copy } from '@/utils';
```

Add the xlsx import right after it:
```typescript
import { copy } from '@/utils';
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: Add `selectedRows` state alongside existing states**

Find this existing state:
```typescript
const [selectedDataStr, setSelectDataStr] = useState('');
```

Add a new state for raw selected rows right after it:
```typescript
const [selectedDataStr, setSelectDataStr] = useState('');
const [selectedRows, setSelectedRows] = useState<Order[]>([]);
```

- [ ] **Step 3: Update `rowSelection.onChange` to also store raw rows**

Find this existing code:
```typescript
const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Order[]) => {
      const result: string[] = [];
      let total = 0;
      selectedRows.map((item) => {
        let sum = 0;
        sum += Math.round(Decimal.mul(parseFloat(item.sellPrice), parseFloat(item.number + '')).toNumber());
        total += sum;
        if (parseFloat(item.number) == 1) {
          result.push(`${item.name}：${sum}`);
        } else {
          result.push(`${item.name}：${item.number} * ${item.sellPrice} = ${sum}`);
        }
      });
      result.push(`总计：${total.toFixed(0)}`);
      setSelectDataStr(result.join('\n'));
    },
  };
```

Replace with:
```typescript
const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], rows: Order[]) => {
      setSelectedRows(rows);
      const result: string[] = [];
      let total = 0;
      rows.map((item) => {
        let sum = 0;
        sum += Math.round(Decimal.mul(parseFloat(item.sellPrice), parseFloat(item.number + '')).toNumber());
        total += sum;
        if (parseFloat(item.number) == 1) {
          result.push(`${item.name}：${sum}`);
        } else {
          result.push(`${item.name}：${item.number} * ${item.sellPrice} = ${sum}`);
        }
      });
      result.push(`总计：${total.toFixed(0)}`);
      setSelectDataStr(result.join('\n'));
    },
  };
```

- [ ] **Step 4: Add `handleExportExcel` function before the `columns` definition**

Find this existing code (the hook calls before columns):
```typescript
  useEffect(() => {
    queryStatistics();
  }, []);

  return (
```

Add the `handleExportExcel` function before the `useEffect`:
```typescript
  const handleExportExcel = () => {
    if (!selectedRows.length) {
      message.warning('请先选择要导出的数据');
      return;
    }

    // Build sheet data: [品名, 日期, 单价, 数量, 总金额]
    const sheetData: any[][] = [['品名', '日期', '单价', '数量', '总金额']];
    let totalSum = 0;

    selectedRows.forEach((item) => {
      const price = parseFloat(item.sellPrice);
      const qty = parseFloat(item.number);
      const amount = price * qty;
      totalSum += amount;
      sheetData.push([
        item.name,
        dayjs(item.orderTime || item.createTime).format('YYYY-MM-DD'),
        price,
        qty,
        amount,
      ]);
    });

    // Summary row
    sheetData.push(['汇总', '', '', '', totalSum]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '订单');
    XLSX.writeFile(wb, `订单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  useEffect(() => {
    queryStatistics();
  }, []);
```

- [ ] **Step 5: Commit**

```bash
cd /Volumes/project/notebook
git add web/src/pages/order/index.tsx
git commit -m "feat: add excel export state and handler"
```

---

### Task 3: Add the Export Excel button

**Files:**
- Modify: `web/src/pages/order/index.tsx` — add the button in the toolbar

- [ ] **Step 1: Add export button next to the copy button**

Find this existing JSX:
```tsx
              <Button type="primary" onClick={handleCopyClick}>
                复制
              </Button>
```

Add the export button right after it:
```tsx
              <Button type="primary" onClick={handleCopyClick}>
                复制
              </Button>
              <Button type="primary" onClick={handleExportExcel}>
                导出 Excel
              </Button>
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/project/notebook
git add web/src/pages/order/index.tsx
git commit -m "feat: add export excel button"
```

---

### Verification

- [ ] **Start the frontend dev server**

```bash
cd /Volumes/project/notebook/web
pnpm dev
```

Expected: Vite dev server starts on port 8001.

- [ ] **Start the Go backend**

```bash
cd /Volumes/project/notebook
go run main.go
```

Expected: Fiber server starts on port 3000, DB connected.

- [ ] **Manual test**: Open `http://localhost:8001`, log in, navigate to order page, select some rows with checkboxes, click "导出 Excel", verify that an `.xlsx` file downloads with correct columns and summary row.
