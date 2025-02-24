import { AutoComplete, AutoCompleteProps } from "antd";
import { match } from "pinyin-pro";
import styles from "./index.module.less";

const PinyinMatchInput = (props: AutoCompleteProps) => {
  return (
    <AutoComplete
      className={styles.pinyinMatchInput}
      options={props.options}
      filterOption={(inputVal, option: any) => {
        if (!inputVal.trim()) {
          return false;
        }
        return !!match(option.label, inputVal)?.length;
      }}
      allowClear
      {...props}
    />
  );
};

export default PinyinMatchInput;
