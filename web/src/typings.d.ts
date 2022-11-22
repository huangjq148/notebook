declare type UserInfo = {
    id: string;
    name?: string;
    createUser: string
    updateUser: string
    createTime: string
    updateTime: string
}

declare type Product = {
    id?: string;
    name: string;
    buyPrice: string;
    sellPrice: string;
    createUser: string
    updateUser: string
    createTime: string
    updateTime: string
}


declare type Order = {
    id?: string
    goodsName: string
    contace: string
    address: string
    phone: string
    buyPrice: string
    sellPrice: string
    number: number
    remark: string
    createUser: string
    updateUser: string
    createTime: string
    updateTime: string
}