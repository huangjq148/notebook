import React from 'react';
import styles from './index.module.less';

const Card = (props: { children: React.ReactNode }) => {
  return <div className={styles.card}>{props.children}</div>;
};

export default Card;
