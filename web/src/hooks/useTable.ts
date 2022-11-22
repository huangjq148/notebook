import React, { useEffect, useState } from "react"

export default <T>(props: { request: any, conditions: Record<string, any> }) => {
    const { request, conditions } = props;
    const [loading, setLoading] = useState(false)
    const [dataSource, setDataSource] = useState<T[]>([
        {
            key: '1',
            name: '胡彦斌',
            age: 32,
            address: '西湖区湖底公园1号',
        },
        {
            key: '2',
            name: '胡彦祖',
            age: 42,
            address: '西湖区湖底公园1号',
        },] as any)

    const loadData = async () => {
        const result = await request(conditions);
        setDataSource(result)
    }

    useEffect(() => {
        loadData()
    }, [])

    return { dataSource, loading, searchForm: loadData }
}