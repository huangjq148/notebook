# 设计系统 - Business Management System

## 设计理念

**风格**: Professional Blue - 专业蓝色系  
**特点**: 专业、可信赖、现代、清晰  
**适用**: SaaS、企业管理、数据可视化

---

## 色彩系统

### 主色调
| Token | 色值 | 用途 |
|-------|------|------|
| `--color-primary` | #2563EB | 主品牌色、按钮、链接 |
| `--color-secondary` | #60A5FA | 次要元素、悬停状态 |
| `--color-cta` | #F97316 | 行动召唤按钮、重要操作 |
| `--color-bg` | #F8FAFC | 页面背景 |
| `--color-text` | #1E293B | 主要文字 |
| `--color-text-muted` | #64748B | 次要文字 |

### 扩展色板
| Token | 色值 | 用途 |
|-------|------|------|
| `--color-success` | #10B981 | 成功状态 |
| `--color-warning` | #F59E0B | 警告状态 |
| `--color-error` | #EF4444 | 错误状态 |
| `--color-info` | #0EA5E9 | 信息提示 |
| `--color-surface` | #FFFFFF | 卡片、浮层背景 |
| `--color-border` | #E2E8F0 | 边框、分割线 |

### 渐变
```css
--gradient-primary: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
--gradient-cta: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
```

---

## 字体系统

### 字体族
- **标题**: Poppins (600, 700)
- **正文**: Open Sans (300, 400, 500, 600)

### 字体层级
| 样式 | 大小 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| H1 | 32px | 700 | 1.2 | 页面标题 |
| H2 | 24px | 600 | 1.3 | 区块标题 |
| H3 | 20px | 600 | 1.4 | 卡片标题 |
| H4 | 16px | 600 | 1.5 | 小标题 |
| Body | 14px | 400 | 1.6 | 正文 |
| Small | 12px | 400 | 1.5 | 辅助文字 |

---

## 间距系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | 4px | 紧凑间距 |
| `--space-sm` | 8px | 小间距 |
| `--space-md` | 16px | 标准间距 |
| `--space-lg` | 24px | 大间距 |
| `--space-xl` | 32px | 区块间距 |

---

## 阴影系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-sm` | 0 1px 2px rgba(37, 99, 235, 0.05) | 轻微浮起 |
| `--shadow-md` | 0 4px 12px rgba(37, 99, 235, 0.1) | 卡片默认 |
| `--shadow-lg` | 0 8px 24px rgba(37, 99, 235, 0.15) | 悬浮卡片 |
| `--shadow-glow` | 0 0 20px rgba(37, 99, 235, 0.3) | 发光效果 |

---

## 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 4px | 小元素 |
| `--radius-md` | 8px | 按钮、输入框 |
| `--radius-lg` | 12px | 卡片 |
| `--radius-xl` | 16px | 大卡片、模态框 |

---

## 组件规范

### 按钮

**主按钮**
- 背景: 蓝色渐变 (#2563EB → #3B82F6)
- 文字: 白色
- 阴影: 蓝色阴影
- 悬停: 背景变亮 + 阴影增强

**CTA 按钮**
- 背景: 橙色渐变 (#F97316 → #FB923C)
- 阴影: 橙色发光效果

### 卡片

- 背景: 白色
- 圆角: 12px
- 阴影: 蓝色系阴影
- 悬停: 上浮 + 阴影增强

### 菜单选中项

- 背景: 蓝色渐变
- 文字: 白色
- 阴影: 蓝色阴影

---

## 字体引入

```html
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```