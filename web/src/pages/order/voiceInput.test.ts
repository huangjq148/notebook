import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { matchVoiceProducts, parseSpokenNumber, parseVoiceActions } from './voiceInput';

test('中文、阿拉伯数字和混合数字保留小数精度', () => {
  for (const [spoken, expected] of [
    ['十一点五', '11.5'],
    ['11.5', '11.5'],
    ['十二点零五', '12.05'],
    ['零', '0'],
    ['两百零三', '203'],
    ['一千零二十', '1020'],
    ['一万两千三百四十五', '12345'],
    ['一亿零三万', '100030000'],
    ['负十一点五', '-11.5'],
    ['1百二十点5', '120.5'],
    ['二〇二六', '2026'],
  ])
    assert.equal(parseSpokenNumber(spoken), expected, spoken);
  for (const invalid of ['苹果十一', '十一元五角', '12.3.4', '', '点五六.七']) {
    assert.equal(parseSpokenNumber(invalid), undefined, invalid);
  }
});

test('连续语句按顺序切列、填值、再新增', () => {
  assert.deepEqual(parseVoiceActions('产品名西红柿，进价十一点五，售价十五，数量二十，其他费用零，新增'), [
    { type: 'field', field: 'name' },
    { type: 'value', value: '西红柿' },
    { type: 'field', field: 'buyPrice' },
    { type: 'value', value: '十一点五' },
    { type: 'field', field: 'sellPrice' },
    { type: 'value', value: '十五' },
    { type: 'field', field: 'number' },
    { type: 'value', value: '二十' },
    { type: 'field', field: 'otherCost' },
    { type: 'value', value: '零' },
    { type: 'add' },
  ]);
  assert.deepEqual(parseVoiceActions('产品名称。'), [{ type: 'field', field: 'name' }]);
  assert.deepEqual(parseVoiceActions('十一点五。'), [{ type: 'value', value: '十一点五' }]);
});

test('拼音匹配允许同音词，返回完整歧义列表并去重', () => {
  const products = ['西红柿', '苹果', '红苹果', '西红柿'];
  assert.deepEqual(matchVoiceProducts(products, '西红是'), ['西红柿']);
  assert.deepEqual(matchVoiceProducts(products, '苹果'), ['苹果', '红苹果']);
  assert.deepEqual(matchVoiceProducts(products, '香蕉'), []);
  assert.deepEqual(matchVoiceProducts(products, ''), []);
});
