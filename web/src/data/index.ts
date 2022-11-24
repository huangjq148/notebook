export const STATUS = [
    { value: "1", label: "进行中" },
    { value: "2", label: "已完成" }
]

export const Dictionary = {
    STATUS
}

type DictionaryKeys = "STATUS"

export const translateToArray = (key: DictionaryKeys) => {
    const tmp: Record<string, string> = {}

    Dictionary[key].map(item => {
        tmp[item.value] = item.label
    })

    return tmp
}