import { useDict, DictKeys } from '@/hooks'

type Props = {
  code: DictKeys
  value: string
}

const DictionaryLabel = (props: Props) => {
  const { getDict } = useDict()
  return getDict(props.code, props.value)
}

export default DictionaryLabel
