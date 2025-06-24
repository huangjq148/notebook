import { message } from 'antd'

export type DictionaryKeys = keyof typeof Dictionary

const Dictionary = {
  yesOrNo: {
    1: '是',
    0: '否',
  },
}

export function getOptionsByKey(key: DictionaryKeys) {
  if (!Dictionary[key]) {
    message.error(`字典中不存在key: ${key}`)
    return [] // 如果key不存在，返回空数组
  }

  return Object.entries(Dictionary[key]).map(([value, label]) => ({
    value,
    label,
  }))
}

export default Dictionary
