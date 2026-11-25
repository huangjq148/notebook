import Decimal from 'decimal.js';

export type BatchProduct = {
  name: string;
  buyPrice: string;
  sellPrice: string;
  number: string;
  otherCost: string;
  tmpId: number;
};

const decimalPattern = /^[0-9]{1,12}(\.[0-9]{1,4})?$/;
const numeric = (value: string, maxLength = 20): Decimal | null =>
  decimalPattern.test(value) && value.length <= maxLength ? new Decimal(value) : null;

export const isEmptyProduct = (row: BatchProduct) =>
  ![row.name, row.buyPrice, row.sellPrice, row.number, row.otherCost].some((value) => value?.trim());

export function productError(row: BatchProduct): string | undefined {
  if (!row.name?.trim()) return '请填写商品名';
  if (!numeric(row.buyPrice)) return '进价应为非负数字，最多四位小数';
  if (!numeric(row.sellPrice)) return '售价应为非负数字，最多四位小数';
  const quantity = numeric(row.number);
  if (!quantity || !quantity.gt(0)) return '数量必须大于零，最多四位小数';
  if (!numeric(row.otherCost || '0', 10)) return '其他费用应为非负数字，最多四位小数且不超过10个字符';
}

export function rowAmounts(row: BatchProduct) {
  const quantity = numeric(row.number);
  const sell = numeric(row.sellPrice);
  const buy = numeric(row.buyPrice);
  const extra = numeric(row.otherCost || '0', 10);
  const sales = quantity?.gt(0) && sell ? sell.mul(quantity) : null;
  const profit = sales && buy && extra ? sales.minus(buy.mul(quantity!)).minus(extra) : null;
  return {
    sales: sales?.toDecimalPlaces(2, Decimal.ROUND_HALF_UP) ?? null,
    profit: profit?.toDecimalPlaces(2, Decimal.ROUND_HALF_UP) ?? null,
  };
}

export function batchTotals(rows: BatchProduct[]) {
  const products = rows.filter((row) => !isEmptyProduct(row));
  return products.reduce(
    (total, row) => {
      const amounts = rowAmounts(row);
      return {
        count: total.count + 1,
        invalid: total.invalid + (productError(row) ? 1 : 0),
        sales: total.sales.plus(amounts.sales ?? 0),
        profit: total.profit.plus(amounts.profit ?? 0),
      };
    },
    { count: 0, invalid: 0, sales: new Decimal(0), profit: new Decimal(0) },
  );
}
