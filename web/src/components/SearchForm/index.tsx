import React from 'react'
import styles from "./index.module.less"

export default (props: { children: React.ReactElement }) => {
    return <div className={styles.searchForm}>
        {props.children}
    </div>
}