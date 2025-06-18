export const generateMenuKeys = (menu: any[], parentPath = "") => {
  return menu.map((item: any) => {
    let fullPath = parentPath ? `${parentPath}/${item.path}` : `/${item.path}`;
    fullPath = fullPath.replace(/\/+/g, "/"); // 防止出现两个 /
    const newItem = { ...item, key: fullPath };

    if (item.children) {
      newItem.children = generateMenuKeys(item.children, fullPath);
    }

    return newItem;
  });
};

export const flattenMenu = (router: Router[], params = {}): Router[] => {
  return router
    .filter((item) => !item.hideInMenu)
    .flatMap((item) => {
      if (item.flatMenu) {
        // 如果当前项被过滤掉，但有 children，则提升 children
        return item.children ? flattenMenu(item.children, params) : [];
      }
      let tmpKey = item.key ?? "";

      Object.entries(params).forEach(([key, value]) => {
        tmpKey = tmpKey.replace(key, value as string);
      });

      return {
        ...item,
        key: tmpKey,
        children: item.children ? flattenMenu(item.children, params) : undefined,
      };
    });
};
