/**
 * 单选组件
 * 用法与 antd 的 Radio 组件一致，增加了 code 属性，用于从字典中获取选项
 * 示例：
 * <Radio code="gender" />
 * <Radio code="gender" value="1" onChange={value => console.log(value)} />
 */
import { DictionaryKeys, getOptionsByKey } from '@/dictionary'
import { Radio as AntdRadio, RadioProps, RadioGroupProps as AntdRadioGroupProps } from 'antd'
const Radio = (props: RadioProps) => <AntdRadio {...props} />

type RadioGroupProps = {
  code?: DictionaryKeys
  value?: any
  onChange?: (value: any) => void
} & AntdRadioGroupProps

Radio.Group = (props: RadioGroupProps) => {
  const { code, options } = props
  const displayOptions = code ? getOptionsByKey(code) : options

  return <AntdRadio.Group options={displayOptions} {...props} />
}

export default Radio
