import { queryContactsByOrders } from '@/services/order';
import { AutoCompleteProps } from 'antd';
import { forwardRef, useEffect, useState } from 'react';
import PinyinMatchInput from '../PinyinMatchInput';

const OrderContactInput = forwardRef<any, AutoCompleteProps>((props, ref) => {
  const [contacts, setContacts] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);

  const loadData = async () => {
    const result = await queryContactsByOrders();
    setContacts(
      result.map((item) => ({
        value: item,
        label: item,
      })),
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  return <PinyinMatchInput ref={ref} placeholder="请输入客户姓名" options={contacts} {...props} />;
});

OrderContactInput.displayName = 'OrderContactInput';

export default OrderContactInput;
