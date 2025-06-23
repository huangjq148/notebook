import React from 'react';
import styles from './index.module.less';
import classnames from 'classnames';

type TextButtonProps = {
  danger?: boolean;
  children: React.ReactNode;
  onClick?: (e: any) => void;
};

export default (props: TextButtonProps) => {
  return (
    <div className={classnames(styles.textButton, { [styles.danger]: props.danger })} onClick={props.onClick}>
      {props.children}
    </div>
  );
};
