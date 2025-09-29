# StellarVote Frontend - 星际投票系统前端

基于Next.js和FHEVM的私密投票平台前端应用。

## ✨ 特性

- 🎨 **全新UI设计** - 明亮渐变主题，与AuroraVote完全不同的视觉风格
- 🔒 **私密投票** - 基于FHEVM同态加密技术保护投票隐私
- ⚡ **实时响应** - 使用Framer Motion提供流畅动画体验
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🌟 **现代技术栈** - Next.js 15 + React 19 + TypeScript + Tailwind CSS

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- MetaMask 钱包

### 安装依赖

```bash
npm install
```

### 生成合约ABI

```bash
npm run genabi
```

### 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

```bash
npm run build
npm start
```

## 🏗️ 项目结构

```
stellarvote-frontend/
├── app/                    # Next.js App Router页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── create/            # 创建提案页面
│   ├── proposals/         # 提案列表页面
│   ├── analytics/         # 数据分析页面
│   └── results/           # 结果查询页面
├── components/            # React组件
│   ├── Navbar.tsx         # 导航栏
│   └── Footer.tsx         # 页脚
├── abi/                   # 智能合约ABI文件
├── scripts/               # 工具脚本
└── public/                # 静态资源
```

## 🎨 设计系统

### 颜色主题

- **Primary**: 紫色到粉色渐变 (#e441ff → #d21fff)
- **Secondary**: 蓝色到青色渐变 (#0ea5e9 → #0284c7)  
- **Accent**: 黄色到橙色渐变 (#facc15 → #ca8a04)

### 组件样式类

- `.stellar-card` - 基础卡片样式
- `.stellar-card-hover` - 可悬停卡片
- `.cosmic-button-*` - 各种按钮样式
- `.stellar-input` - 输入框样式
- `.cosmic-gradient-text` - 渐变文字

## 🔧 配置

### 合约配置

在 `abi/StellarVoteCoreAddresses.ts` 中配置合约地址：

```typescript
export const StellarVoteCoreAddresses = {
  "11155111": { // Sepolia
    address: "0x...", // 部署后的合约地址
    blockNumber: 0
  }
};
```

### 环境变量

创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## 📦 依赖说明

### 核心依赖

- **Next.js 15** - React全栈框架
- **React 19** - UI库
- **ethers.js** - 以太坊交互库
- **@zama-fhe/relayer-sdk** - FHEVM中继器SDK
- **framer-motion** - 动画库
- **react-icons** - 图标库

### 开发依赖

- **TypeScript** - 类型检查
- **Tailwind CSS** - 原子化CSS框架
- **@fhevm/mock-utils** - FHEVM模拟工具

## 🔗 与合约交互

项目使用relayer-sdk与FHEVM合约进行交互：

```typescript
import { StellarVoteCoreABI } from "@/abi/StellarVoteCoreABI";
import { StellarVoteCoreAddresses } from "@/abi/StellarVoteCoreAddresses";

// 创建合约实例
const contract = new ethers.Contract(
  StellarVoteCoreAddresses[chainId].address,
  StellarVoteCoreABI.abi,
  signer
);
```

## 🌟 核心功能

1. **创建提案** - 分步骤表单创建投票提案
2. **提案列表** - 浏览和筛选所有提案
3. **私密投票** - 使用同态加密进行投票
4. **结果查看** - 查看已公布的投票结果
5. **数据分析** - 投票趋势和统计信息

## 📱 响应式设计

- 桌面端：完整功能和最佳体验
- 平板端：优化布局适配中等屏幕
- 移动端：简化界面保持核心功能

## 🎯 开发规范

- 使用TypeScript进行类型安全
- 遵循ESLint和Prettier规范
- 组件采用函数式组件 + Hooks
- 样式使用Tailwind CSS原子化类名
- 动画使用Framer Motion库

## 🔒 安全考虑

- 所有用户输入都进行验证
- 合约交互使用try-catch错误处理
- 私钥和敏感信息不存储在前端
- 使用HTTPS进行生产部署

## 📄 许可证

BSD-3-Clause-Clear

---

Made with ❤️ for the future of voting
