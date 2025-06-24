import dict, { DictionaryKeys } from '@/dictionary'

export type DictKeys = DictionaryKeys

export default function () {
  const getDict = (key: DictKeys, value: number | string) => {
    return (dict as any)?.[key]?.[value] ?? value
  }
  return {
    getDict,
  }
}
