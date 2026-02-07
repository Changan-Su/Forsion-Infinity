# Function Index - 功能索引

本索引记录 Forsion-Infinity 项目中实现的各项功能及其文档。

## 目录结构

每个功能文档包含：
- 功能概述
- 使用方法
- 技术实现
- 相关文件
- 更新历史

---

## 已实现功能列表

### 1. HTML Bundle 上传功能

**文档：** 
- [HTML-Bundle-上传功能.md](./HTML-Bundle-上传功能.md) - 完整使用说明
- [HTML-Bundle-按钮实现总结.md](./HTML-Bundle-按钮实现总结.md) - 实现总结和测试指南

**功能描述：** 允许用户上传包含 HTML、CSS、JavaScript 的 ZIP 压缩包，在帖子中以交互式组件形式展示。

**关键特性：**
- 支持完整的前端技术栈（HTML/CSS/JS）
- 安全的沙箱隔离
- 自动解压和验证
- 多语言界面支持
- 专用工具栏按钮（📄 图标）
- 友好的上传引导

**更新时间：** 2025-01-25

**状态：** ✅ 已完成

---

### 2. 小红书风格视图功能

**文档：** [小红书风格视图功能.md](./小红书风格视图功能.md)

**功能描述：** 为 Explore 页面新增瀑布流和紧凑卡片视图，提供类似小红书的视觉化内容浏览体验。

**关键特性：**
- 三种视图模式切换（列表/瀑布流/紧凑）
- 小红书风格卡片设计（封面+标题+作者）
- 响应式适配（桌面 5 列→移动 2 列）
- 视图偏好自动保存
- 支持视频、GIF 标识
- 无图片优雅降级

**更新时间：** 2026-02-03

**状态：** ✅ 已完成

---

### 3. Forsion Backend 统一登录集成

**文档：** 
- [Forsion-Backend登录系统集成实施.md](../Log/2026-02-04-Forsion-Backend登录系统集成实施.md) - 完整实施记录
- [JWT验证方式修复说明.md](../Log/2026-02-04-JWT验证方式修复说明.md) - v2.0 快速升级指南
- [FORSION_INTEGRATION.md](../../misskey-develop/FORSION_INTEGRATION.md) - 配置指南
- [forsion-login-integration skill](../../.cursor/skills/forsion-login-integration/SKILL.md) - 通用集成 Skill

**功能描述：** 将 Misskey 的用户认证系统完全集成到 Forsion Backend 统一登录平台，实现跨应用的单点登录（SSO）。

**关键特性：**
- **JWT Token 认证**: 基于 JWT 的无状态认证
- **API 远程验证**: Misskey Backend 通过 Forsion Backend API 验证 token（v2.0）
- **自动用户创建**: 首次登录自动创建 Misskey 账号并建立映射
- **用户名冲突处理**: 自动添加数字后缀解决冲突
- **一对一映射**: Forsion User ↔ Misskey User 映射表
- **无缝登录体验**: 从 Forsion 登录页重定向回 Misskey，自动完成登录
- **向后兼容**: 保留 Misskey 原生登录（可配置关闭）
- **安全隔离**: JWT_SECRET 只存在于 Forsion Backend，不共享给集成应用

**技术实现：**
- **后端服务**:
  - `ForsionAuthService`: 通过 API 验证 JWT token，获取用户信息
  - `ForsionUserProvisionService`: 自动创建/查找 Misskey 用户
  - `AuthenticateService`: 集成 Forsion 认证流程
  - `ForsionUserMapping`: 用户映射模型和数据库表
  
- **前端组件**:
  - `forsionAuth.ts`: Token 管理、重定向、初始化
  - `MkSignin.vue`: 显示 "Login with Forsion" 按钮
  - `MkVisitorDashboard.vue`: 访客页面 Forsion 登录入口
  - `misskey-api.ts`: API 请求自动携带 JWT token

- **配置管理**:
  - Backend: `.config/default.yml` 中配置 `forsion.enabled` 和 `forsion.apiUrl`
  - Frontend: `.env` 中配置 `VITE_FORSION_AUTH_URL` 和 `VITE_FORSION_API_URL`

**版本历史：**
- **v1.0** (2026-02-04 初版): 本地 JWT 验证模式（需要配置 JWT_SECRET）
- **v2.0** (2026-02-04 修复): API 远程验证模式（JWT_SECRET 只在 Forsion Backend）

**更新时间：** 2026-02-04

**状态：** ✅ 已完成（v2.0）

---

## 待实现功能

（暂无）

---

## 索引说明

- **✅ 已完成**：功能已实现并通过测试
- **🚧 开发中**：功能正在开发
- **📋 计划中**：已规划但尚未开始
- **❌ 已废弃**：功能已停用或移除

---

**最后更新：** 2026-02-04
