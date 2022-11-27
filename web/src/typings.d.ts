declare interface CreateInfo {
    createUser: string
    updateUser: string
    createTime: string
    updateTime: string
}

declare interface UserInfo extends CreateInfo {
    id: string;
    name?: string;
}

declare interface Product extends CreateInfo {
    id?: number;
    name: string;
    buyPrice: string;
    sellPrice: string;
}


declare interface Order extends CreateInfo {
    id?: number
    goodsName: string
    contace: string
    address: string
    phone: string
    buyPrice: string
    sellPrice: string
    number: number
    remark: string
    status: string
    stockId: number
}

declare interface Contact extends CreateInfo {
    id?: string
    name: string
    phone: string
    address: string
}
declare interface Stock extends CreateInfo {
    id?: number;
    name: string;
    buyPrice: string;
    sellPrice: string;
    number: number
}