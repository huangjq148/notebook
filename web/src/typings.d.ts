type Router = RouteObject & {
  children?: Router[];
  label?: string;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
};

declare interface CreateInfo {
  createUser: string;
  updateUser: string;
  createTime: string;
  updateTime: string;
}

declare interface UserInfo extends CreateInfo {
  id: string;
  name?: string;
  // 账号用户名
  username?: string;
}

declare interface Product extends CreateInfo {
  id?: number;
  name: string;
  buyPrice: string;
  sellPrice: string;
}

declare interface Order extends CreateInfo {
  id?: number;
  name: string;
  contace: string;
  address: string;
  phone: string;
  buyPrice: string;
  sellPrice: string;
  number: string;
  remark: string;
  status: string;
  stockId: number;
  orderTime: string;
}

declare interface Contact extends CreateInfo {
  id?: string;
  name: string;
  phone: string;
  address: string;
}
declare interface Stock extends CreateInfo {
  id?: number;
  name: string;
  buyPrice: string;
  sellPrice: string;
  number: number;
}
