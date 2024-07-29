import { Select, SelectProps } from "antd";
import { queryContactsByOrders } from "@/services/order";
import { useEffect, useState } from "react";

const OrderContactSelect = (props: SelectProps) => {
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);

  const loadData = async () => {
    const result = await queryContactsByOrders();
    setContacts(result.map((item) => ({ value: item, label: item })));
  };

  useEffect(() => {
    loadData();
  }, []);

  return <Select mode="tags" options={contacts} {...props} />;
};

export default OrderContactSelect;
