import React from 'react'
import styles from "./index.module.less"

type TextButtonProps = {
    children: React.ReactNode
    onClick: (e: any) => void
}

export default (props: TextButtonProps) => {
    return <div className={styles.textButton} onClick={props.onClick}>{props.children}</div>
}