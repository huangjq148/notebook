/**
 * 下拉选择框
 * 用法与 Antd 一致，增加了 code 属性，用于从字典中获取选项
 * 示例：
 * <Select code="gender" />
 * <Select code="gender" value="1" onChange={value => console.log(value)} />
 */
import { Select as AntdSelect, SelectProps } from 'antd'
import { getOptionsByKey, DictionaryKeys } from '@/dictionary'

type Props = {
  code?: DictionaryKeys
  value?: any
  onChange?: (value: any) => void
} & SelectProps

const Select = (props: Props) => {
  const { code, options } = props
  const displayOptions = code ? getOptionsByKey(code) : options

  return <AntdSelect options={displayOptions} {...props} />
}

export default Select
