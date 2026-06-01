# 项目功能分析

## 项目定位

该项目是一个基于 React、Vite、Ant Design 的个人/小团队账簿管理前端。核心业务围绕商品、库存、联系人、订单和经营概览展开，提供桌面端后台管理界面和一个移动端订单操作页面。

## 当前启用功能

### 1. 登录与账号状态

- 支持用户名、密码登录。
- 登录成功后保存 access token，并在后续请求中自动携带 `Authorization: Bearer <token>`。
- 支持把多个账号 token 缓存在本地，便于在顶部用户菜单中切换账号。
- 支持删除本地缓存账号。
- 支持退出登录，退出时清除当前 token 并刷新页面。
- 请求遇到 401 时会提示登录过期，并跳转到 `/login`。

相关入口：
- `/login`
- `src/services/auth.ts`
- `src/store/user.ts`
- `src/utils/auth.ts`
- `src/utils/request.ts`

### 2. 主布局与导航

- 登录后进入后台布局，左侧为菜单，顶部为用户操作区。
- 左侧菜单当前启用：概览、订单、商品、库存、联系人。
- 顶部用户菜单提供：数据转移、切换账号、退出。
- 内容区通过 React Router 子路由渲染业务页面。

相关入口：
- `/`
- `/overview`
- `/orders`
- `/product`
- `/stock`
- `/contact`
- `/setting/data-transfer`

### 3. 经营概览

- 默认按本月时间范围加载经营数据。
- 支持快捷日期筛选和手动查询。
- 展示核心指标：总销售额、总利润、订单数、平均利润率及环比变化。
- 展示 Top 数据：
  - 购买最多的产品
  - 卖得最多的产品
  - 利润最高的产品
  - 利润最多的客户
- 展示近 14 天利润趋势图。
- 支持手动刷新，并显示最后更新时间。

相关接口：
- `GET /overview`
- `GET /overview/core-metrics`
- `GET /overview/profit/statistics`

### 4. 订单管理

- 支持按产品、联系人、日期范围等条件查询订单。
- 支持分页表格展示订单。
- 支持新增单个订单。
- 支持批量创建订单，一次填写客户信息并添加多个产品行。
- 支持编辑订单。
- 支持删除订单。
- 支持从库存出货生成订单后撤销出库。
- 支持查看联系人详情信息。
- 支持复制选中订单的汇总文本。
- 展示订单统计信息，包括成本、销售额、数量和其他费用。
- 创建/编辑订单时支持选择已有商品和联系人。
- 创建单个订单和批量订单时支持本地草稿保存与恢复。

相关接口：
- `GET /order`
- `POST /order`
- `GET /order/:id`
- `PATCH /order/:id`
- `DELETE /order/:id`
- `GET /order/statistics`
- `DELETE /order/revoke/stock/:id`
- `GET /order/contacts`
- `GET /order/products`

### 5. 移动端订单页

- 提供独立移动端订单页面，适合手机录入和管理订单。
- 支持订单筛选、分页加载和统计展示。
- 支持新建、编辑、删除订单。
- 支持批量创建移动端订单草稿。
- 支持复制订单汇总文本。
- 支持从库存订单撤销出库。
- 使用抽屉和弹窗完成产品、联系人选择。

相关入口：
- `/mobile/orders`

### 6. 商品管理

- 支持按商品名称查询商品。
- 支持新增商品。
- 支持编辑商品。
- 支持删除商品。
- 商品字段包括：商品名、进价、售价。
- 订单和库存表单中可复用商品选择能力。

相关接口：
- `GET /product`
- `POST /product`
- `GET /product/:id`
- `PATCH /product/:id`
- `DELETE /product/:id`

### 7. 库存管理

- 支持按商品名称查询库存。
- 支持新增库存。
- 支持编辑库存。
- 支持删除库存。
- 支持从库存执行“出货”，出货时复用订单编辑表单生成订单。
- 展示库存汇总：总成本、总售价、总利润。
- 库存字段包括：商品名、进价、售价、数量。

相关接口：
- `GET /stock`
- `POST /stock`
- `GET /stock/:id`
- `PATCH /stock/:id`
- `DELETE /stock/:id`
- `GET /stock/statistics`

### 8. 联系人管理

- 支持按姓名、电话、地址查询联系人。
- 支持新增联系人。
- 支持编辑联系人。
- 支持删除联系人。
- 联系人字段包括：姓名、电话、地址。
- 订单表单中可复用联系人选择能力。

相关接口：
- `GET /contact`
- `POST /contact`
- `GET /contact/:id`
- `PATCH /contact/:id`
- `DELETE /contact/:id`
- `GET /contact/search`

### 9. 数据转移

- 支持对订单和库存数据进行批量选择。
- 支持选择目标用户后发起数据移交。
- 目标用户列表来自用户接口。
- 入口隐藏在顶部用户菜单中，而不是左侧主菜单。

相关入口：
- `/setting/data-transfer`

相关接口：
- `GET /user`
- `POST /system/data/transfer`

## 通用能力

### 请求与错误处理

- 统一使用 Axios 请求封装。
- 开发环境请求前缀为 `/api`，生产环境请求前缀为 `/server`。
- 请求默认超时时间为 30 秒。
- 自动附加 JSON Content-Type。
- 自动处理业务失败提示、接口错误提示和登录过期跳转。

### 表格与查询

- 多个列表页面复用 `useTable`，统一处理：
  - loading 状态
  - 分页参数
  - 查询条件
  - 数据源更新
  - total 更新
- 通用表格组件支持日期格式化、百分比/数值展示和比较值展示。

### 输入辅助

- 商品、联系人输入支持远程候选或历史候选选择。
- 拼音匹配输入用于提升中文条目的检索体验。
- 日期范围组件封装了常用快捷范围。

### 图表

- 概览页使用 ECharts 展示柱状图、折线图等。
- 图表组件通过 ResizeObserver 响应容器尺寸变化。

### 构建优化

- 已排除未启用页面进入动态路由构建。
- 已将 Ant Design、ECharts、React、通用工具库拆分成多个 vendor chunk，降低单个构建产物体积并提升缓存粒度。

## 源码保留但当前未启用的功能

以下功能在源码中存在，但当前路由菜单已注释，且动态构建入口中已排除部分页面。它们更像历史功能或待恢复功能。

### 1. 闹钟提醒

- 支持创建、编辑、删除提醒。
- 支持按周几选择提醒日期。
- 支持设置提醒时间。
- 支持启用/停用、是否重复。
- 支持立即发送到企业微信/微信 Webhook。

相关页面：
- `src/pages/alarm`

### 2. 朗读/口语练习

- 使用浏览器 SpeechSynthesis 朗读固定文本。
- 支持句子/单词模式。
- 支持循环播放。
- 通过 FloatButton 控制播放和停止。

相关页面：
- `src/pages/speak`

### 3. 学生作业管理

- 支持创建学生作业日期记录。
- 支持进入某天作业详情。
- 支持按学科配置作业内容。
- 支持勾选作业完成状态。
- 支持作业图片上传入口。

相关页面：
- `src/pages/studentWork/manage`
- `src/pages/studentWork/manage/subjectWork`

### 4. 计算题生成

- 支持生成加、减、乘、除计算题。
- 支持设置题目数量和答案范围。
- 支持打印题目。
- 支持保存生成结果。
- 支持显示/隐藏答案。

相关页面：
- `src/pages/studentWork/calculatorManage`
- `src/pages/studentWork/generateCalculator`

## 主要数据模型

### 商品 Product

- `id`
- `name`
- `buyPrice`
- `sellPrice`
- 创建/更新信息

### 订单 Order

- `id`
- `name`
- `contact`
- `address`
- `phone`
- `buyPrice`
- `sellPrice`
- `number`
- `remark`
- `status`
- `stockId`
- `orderTime`
- 创建/更新信息

### 联系人 Contact

- `id`
- `realname`
- `phone`
- `address`
- 创建/更新信息

### 库存 Stock

- `id`
- `name`
- `buyPrice`
- `sellPrice`
- `number`
- 创建/更新信息

### 用户 UserInfo

- `id`
- `realname`
- `username`
- 创建/更新信息

## 当前功能边界

- 项目主要是前端管理系统，业务数据依赖后端接口。
- 权限控制主要体现在 token 登录态，前端暂未看到细粒度权限控制。
- 当前启用菜单不包含闹钟、朗读、学生作业、计算题功能。
- 数据转移功能从用户下拉菜单进入，不在左侧主导航展示。
