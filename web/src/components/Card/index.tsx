import React from 'react';
import styles from './index.module.less';

const Card = (props: { header?: React.ReactNode; children: React.ReactNode }) => {
  return (
    <div className={styles.card}>
      {props.header ? <div className={styles.cardHeader}>{props.header}</div> : null}
      <div className={styles.cardBody}>{props.children}</div>
    </div>
  );
};

export default Card;
