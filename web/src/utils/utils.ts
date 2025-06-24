const formatLargeNumberWithCommas = (numberString: string) => {
  const parts = numberString.split('.')
  const integerPart = parts[0]
  const decimalPart = parts.length > 1 ? '.' + parts[1] : ''
  const regex = /\B(?=(\d{3})+(?!\d))/g
  return integerPart.replace(regex, ',') + decimalPart
}

export const isNumeric = (value: string) => {
  return /^-?\d+(\.\d+)?$/.test(value ?? '')
}
export const getNumToLocaleString = (value?: any, params?: { empty?: any; dw?: string; desc?: any }) => {
  let valText = value
  if (typeof value === 'string' && isNumeric(value)) {
    valText = formatLargeNumberWithCommas(value)
  } else {
    try {
      try {
        valText = value?.toLocaleString?.() ?? value
      } catch (error) {
        valText = value
        console.error(error)
      }
    } catch (error) {
      console.log('stop', error, value, params)
      valText = value
    }
  }
  let _text = value
  if (valText && valText?.includes(',')) {
    _text = valText
  }
  return `${_text ?? params?.empty ?? ''}${params?.dw ?? ''}${params?.desc ?? ''}`
}

