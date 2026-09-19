import { AutoComplete, AutoCompleteProps } from 'antd';
import { forwardRef } from 'react';
import { match } from 'pinyin-pro';
import styles from './index.module.less';

const PinyinMatchInput = forwardRef<any, AutoCompleteProps>((props, ref) => {
  return (
    <AutoComplete
      ref={ref}
      className={styles.pinyinMatchInput}
      options={props.options}
      filterOption={(inputVal, option: any) => {
        if (!inputVal.trim()) {
          return false;
        }
        return !!match(option?.label ?? '', inputVal)?.length;
      }}
      allowClear
      {...props}
    />
  );
});

PinyinMatchInput.displayName = 'PinyinMatchInput';

export default PinyinMatchInput;
