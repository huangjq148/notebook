import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { matchVoiceNames, parseSpokenNumber, parseVoiceActions } from './voiceInput';

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
  assert.deepEqual(matchVoiceNames(products, '西红是'), ['西红柿']);
  assert.deepEqual(matchVoiceNames(products, '苹果'), ['苹果', '红苹果']);
  assert.deepEqual(matchVoiceNames(products, '香蕉'), []);
  assert.deepEqual(matchVoiceNames(products, ''), []);
});

test('姓名、上一行和产品字段可在同一句中连续切换', () => {
  assert.deepEqual(parseVoiceActions('姓名张三，上一行，进价十一点五'), [
    { type: 'field', field: 'contact' },
    { type: 'value', value: '张三' },
    { type: 'previous' },
    { type: 'field', field: 'buyPrice' },
    { type: 'value', value: '十一点五' },
  ]);
  assert.deepEqual(parseVoiceActions('姓名。'), [{ type: 'field', field: 'contact' }]);
  assert.deepEqual(parseVoiceActions('张三。'), [{ type: 'value', value: '张三' }]);
  for (const command of ['上一行', '切换上一行', '切换到上一行', '切到上一行']) {
    assert.deepEqual(parseVoiceActions(command), [{ type: 'previous' }], command);
  }
});

test('姓名先转拼音，保留同音候选并去重', () => {
  assert.deepEqual(matchVoiceNames(['张三', '李四', '张三'], '章三'), ['张三']);
  assert.deepEqual(matchVoiceNames(['张三', '章三', '李四'], '张三'), ['张三', '章三']);
  assert.deepEqual(matchVoiceNames(['张三', '李四'], '王五'), []);
});

test('序号选择支持中文、阿拉伯数字和选择前缀，不当成字段值', () => {
  for (const [command, index] of [
    ['第一个', 0],
    ['第二项', 1],
    ['选择第3个', 2],
    ['选第二项', 1],
    ['第十一项', 10],
    ['第零个', -1],
  ] as const) {
    assert.deepEqual(parseVoiceActions(command), [{ type: 'select', index }]);
  }
  assert.deepEqual(parseVoiceActions('姓名张三，第二个，产品名苹果，选第一项，数量十二'), [
    { type: 'field', field: 'contact' },
    { type: 'value', value: '张三' },
    { type: 'select', index: 1 },
    { type: 'field', field: 'name' },
    { type: 'value', value: '苹果' },
    { type: 'select', index: 0 },
    { type: 'field', field: 'number' },
    { type: 'value', value: '十二' },
  ]);
});
