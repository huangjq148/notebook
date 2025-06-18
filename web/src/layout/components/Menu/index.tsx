import { Menu } from "antd";
import { routeWithKey } from "@/routes/modules";
import { useNavigate } from "react-router-dom";

const SiderMenu = () => {
  const navigate = useNavigate();

  const handleMenuItemClick = (val: { key: string }) => {
    navigate(val.key);
  };

  return (
    <Menu
      theme="light"
      mode="inline"
      items={routeWithKey}
      selectedKeys={[location.pathname]}
      onClick={handleMenuItemClick}
    />
  );
};

export default SiderMenu;
