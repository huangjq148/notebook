import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { batchTotals, productError, rowAmounts, type BatchProduct } from './batchOrder';

const row = (values: Partial<BatchProduct> = {}): BatchProduct => ({
  name: '测试商品',
  buyPrice: '1.1',
  sellPrice: '2.2',
  number: '3',
  otherCost: '',
  tmpId: 1,
  ...values,
});

test('行金额和利润准确计算，其他费用每行只扣一次', () => {
  const amounts = rowAmounts(row({ otherCost: '0.2' }));
  assert.equal(amounts.sales?.toFixed(2), '6.60');
  assert.equal(amounts.profit?.toFixed(2), '3.10');
  assert.equal(rowAmounts(row({ buyPrice: '3' })).profit?.toFixed(2), '-2.40');
});

test('免费商品有效，零数量、负数和非法数值不能提交', () => {
  assert.equal(productError(row({ buyPrice: '0', sellPrice: '0' })), undefined);
  for (const values of [
    { number: '0' },
    { number: '-1' },
    { buyPrice: 'NaN' },
    { sellPrice: '1.23456' },
    { otherCost: '12345678901' },
  ]) {
    assert.ok(productError(row(values)));
  }
});

test('不完整行保留在汇总中并提示，无法计算的金额不显示为零', () => {
  const partial = row({ number: '' });
  assert.equal(rowAmounts(partial).sales, null);
  assert.equal(rowAmounts(partial).profit, null);
  const total = batchTotals([row(), partial, row({ name: '', buyPrice: '', sellPrice: '', number: '' })]);
  assert.equal(total.count, 2);
  assert.equal(total.invalid, 1);
  assert.equal(total.sales.toFixed(2), '6.60');
  assert.equal(total.profit.toFixed(2), '3.30');
});

test('每行按两位小数四舍五入，合计与展示的行金额一致', () => {
  const values = row({ buyPrice: '0', sellPrice: '0.005', number: '1' });
  assert.equal(rowAmounts(values).sales?.toFixed(2), '0.01');
  assert.equal(batchTotals([values, values]).sales.toFixed(2), '0.02');
  assert.equal(batchTotals([values, values]).profit.toFixed(2), '0.02');
});
