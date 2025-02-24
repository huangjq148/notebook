import { queryProductsByOrders } from "@/services/order";
import { AutoCompleteProps } from "antd";
import { useEffect, useState } from "react";
import PinyinMatchInput from "../PinyinMatchInput";

const OrderProductInput = (props: AutoCompleteProps) => {
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);

  const loadData = async () => {
    const result = await queryProductsByOrders();
    setProducts(result.map((item) => ({ value: item, label: item })));
  };

  useEffect(() => {
    loadData();
  }, []);

  return <PinyinMatchInput placeholder="请输入产品名称" options={products} {...props} />;
};

export default OrderProductInput;
