import { Spin } from 'antd';
import React from 'react';
import { Suspense } from 'react';

const modules: any = import.meta.glob('@/pages/**/index.tsx', { eager: false });

const componentsMap: Record<string, any> = {};

function transformPath(path: string) {
  // 验证路径：/pages/后的每个文件夹名必须以小写字母开头
  const pathValid = /^\/src\/pages(\/[a-z][^/]*)*(\/index\.tsx)?$/.test(path);
  if (!pathValid) return null; // 不符合条件返回null

  // 移除/src前缀
  let result = path.replace(/^\/src/, '');

  // 如果以/index.tsx结尾，则移除
  result = result.replace(/\/index\.tsx$/, '');

  return result;
}

for (const path in modules) {
  let name = transformPath(path);
  if (name) {
    name = `@${name}`;
    componentsMap[name] = React.lazy(modules[path]);
  }
}

const lazyLoad = (componentName: string): any => {
  const Component = componentsMap[componentName] || null;
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spin size="large"></Spin>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
};

export default lazyLoad;
