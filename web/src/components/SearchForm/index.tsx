import React from "react";
import styles from "./index.module.less";

export default (props: { children: React.ReactElement; style?: React.CSSProperties }) => {
  return (
    <div className={styles.searchForm} {...props}>
      {props.children}
    </div>
  );
};
