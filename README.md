# Inkcraft 应试作文工具

## 简介

**项目背景**  
Inkcraft 是基于 Next.js 的现代化数字内容创作平台，致力于帮助创作者高效生产结构化的数字内容资产。

**技术栈**  
- 框架: Next.js 15.3.0 (App Router)
- 前端: React 19 + TypeScript
- UI 库: Radix UI + shadcn/ui
- 动画: Framer Motion 12.7.4
- 状态管理: @tanstack/react-table 8.21.2
- 数据可视化: Recharts 2.15.2

## 如何开发

**环境要求**  
- Node.js 18+  
- pnpm 8.6+

**安装步骤**
```bash
pnpm install
pnpm prisma generate
```

**开发命令**
```bash
# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 代码质量检查
pnpm lint
```

## 其他

**开源协议**  
本项目采用 [CC-BY-NC-4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh) 非商业性共享协议，禁止未经授权的商业用途。

**贡献指南**  
1. Fork 项目仓库  
2. 创建特性分支 (`git checkout -b feature/xxx`)  
3. 提交代码变更  
4. 发起 Pull Request 并关联对应 issue

**核心依赖版本**  
详见 [package.json](./package.json)
