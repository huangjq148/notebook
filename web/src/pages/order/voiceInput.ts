import { pinyin } from 'pinyin-pro';

export const voiceFields = {
  姓名: 'contact',
  产品名称: 'name',
  产品名: 'name',
  品名: 'name',
  进价: 'buyPrice',
  售价: 'sellPrice',
  数量: 'number',
  其他费用: 'otherCost',
  其它费用: 'otherCost',
} as const;
export type VoiceField = (typeof voiceFields)[keyof typeof voiceFields];
export type VoiceAction =
  | { type: 'field'; field: VoiceField }
  | { type: 'add' }
  | { type: 'previous' }
  | { type: 'select'; index: number }
  | { type: 'value'; value: string };

export function parseVoiceActions(transcript: string): VoiceAction[] {
  return transcript
    .split(
      /(姓名|产品名称|产品名|品名|进价|售价|数量|其他费用|其它费用|新增|(?:切换到?|切到)?上一行|(?:选择|选)?第[\d零〇一二两三四五六七八九十百]+[个项])/,
    )
    .flatMap((part): VoiceAction[] => {
      const value = part.replace(/^[\s，。！？、,:：!？?]+|[\s，。！？、,:：!？?]+$/g, '');
      if (!value) return [];
      const ordinal = value.match(/^(?:选择|选)?第([\d零〇一二两三四五六七八九十百]+)[个项]$/);
      if (ordinal) return [{ type: 'select', index: Number(parseSpokenNumber(ordinal[1])) - 1 }];
      if (/^(?:切换到?|切到)?上一行$/.test(value)) return [{ type: 'previous' }];
      if (value === '新增') return [{ type: 'add' }];
      if (value in voiceFields) return [{ type: 'field', field: voiceFields[value as keyof typeof voiceFields] }];
      return [{ type: 'value', value }];
    });
}

const digits: Record<string, string> = {
  零: '0',
  〇: '0',
  一: '1',
  二: '2',
  两: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
};

// 保留小数位，拒绝夹杂文字的结果，避免把听错的内容当成金额。
export function parseSpokenNumber(value: string): string | undefined {
  const text = value.replace(/\s/g, '').replace(/负/g, '-').replace(/点/g, '.');
  if (!/^-?[\d零〇一二两三四五六七八九十百千万亿]+(?:\.[\d零〇一二两三四五六七八九]+)?$/.test(text)) return;
  const negative = text.startsWith('-');
  const [integer, fraction] = text.replace(/^-/, '').split('.');
  const convertDigits = (part: string) => [...part].map((char) => digits[char] ?? char).join('');
  let total = 0,
    section = 0,
    number = 0;
  if (/[十百千万亿]/.test(integer)) {
    const tokens = integer.match(/[\d零〇一二两三四五六七八九]+|[十百千万亿]/g) ?? [];
    for (const token of tokens) {
      const unit = ({ 十: 10, 百: 100, 千: 1000, 万: 10000, 亿: 100000000 } as Record<string, number>)[token];
      if (!unit) {
        number = Number(convertDigits(token));
        continue;
      }
      if (unit < 10000) section += (number || 1) * unit;
      else if (unit === 10000) {
        total += (section + number) * unit;
        section = 0;
      } else {
        total = (total + section + number) * unit;
        section = 0;
      }
      number = 0;
    }
    total += section + number;
  } else total = Number(convertDigits(integer));
  if (!Number.isSafeInteger(total)) return;
  return `${negative ? '-' : ''}${total}${fraction === undefined ? '' : `.${convertDigits(fraction)}`}`;
}

export const toNamePinyin = (text: string) =>
  pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase().replace(/\s/g, '');
export function matchVoiceNames(names: string[], spoken: string): string[] {
  const query = toNamePinyin(spoken);
  return query ? [...new Set(names)].filter((name) => toNamePinyin(name).includes(query)) : [];
}
