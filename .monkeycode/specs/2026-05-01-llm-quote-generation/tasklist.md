# Implementation Task List: LLM 无限语录生成

## Task 1: API 配置与 Key 管理

### 1.1 创建 API 设置面板 UI
- [x] 在 Web 端添加设置入口（右上角齿轮图标）
- [x] 设计设置面板：API Key 输入框 + 模型选择下拉 + 保存按钮
- [x] 支持模型选项：通义千问(qwen-turbo)、智谱清言(glm-4)、文心一言(ernie-bot)
- [x] API Key 存储在 localStorage，使用简单混淆（非明文）

### 1.2 API Key 验证功能
- [x] 实现 Key 有效性验证（发送测试请求）
- [x] 验证成功/失败的用户反馈
- [x] 首次打开应用时引导设置 API Key

## Task 2: 核心模块实现

### 2.1 QuoteGenerator (LLM 生成器)
- [x] 实现多模型适配层（通义/智谱/文心）
- [x] 实现 generate() 方法：调用 API 生成单条语录
- [x] 实现 Prompt 模板系统
- [x] 实现 JSON 结果解析与校验

### 2.2 QuoteCache (缓存管理器)
- [x] 实现 localStorage 缓存读写
- [x] 实现缓存池管理（上限 50 条）
- [x] 实现去重机制（基于正文相似度 80%）
- [x] 实现展示历史记录（最近 200 条）

### 2.3 QuotaManager (额度管理器)
- [x] 实现每日调用计数（上限 100 次）
- [x] 实现每日零点自动重置
- [x] 实现超额拦截逻辑

### 2.4 QuoteRouter (路由调度器)
- [x] 实现 getNextQuote() 核心方法
- [x] 实现降级链路：缓存 → API → 预设
- [x] 实现预加载触发（缓存低于 5 条时）
- [x] 实现连续失败熔断（3 次失败暂停 30 分钟）

## Task 3: Web 端集成

### 3.1 集成到现有滑动逻辑
- [x] 修改滑动到底部时的行为：从缓存/LLM 获取新语录
- [x] 添加加载状态提示
- [x] 实现预设语录与 LLM 语录的无缝混合

### 3.2 UI 优化
- [x] 设置面板样式（玻璃拟态风格）
- [x] 加载动画优化
- [x] LLM 生成语录的特殊标识（可选）

## Task 4: 小程序端适配

### 4.1 小程序 API Key 设置
- [x] 在"我的空间"页添加 API 设置入口
- [x] 实现小程序端 Key 存储（wx.setStorageSync）
- [x] 适配小程序网络请求（wx.request）

### 4.2 核心模块移植
- [x] 移植 QuoteGenerator（使用 wx.request）
- [x] 移植 QuoteCache
- [x] 移植 QuotaManager
- [x] 集成到小程序滑动逻辑

## Task 5: 测试与优化

### 5.1 功能测试
- [x] 代码审查与结构验证 (JS 解析检查)
- [x] 修复 Web 端 LLM 语录 category/badge 缺失
- [x] 修复 Web 端去重机制 (精确匹配 → 80% 相似度)
- [x] 修复 Web 端 fallback 逻辑冲突
- [x] 修复小程序 JSON 正则表达式 (支持嵌套对象)
- [x] 修复小程序 preloadQuotes 数组引用问题
- [x] 修复小程序 space.js 状态同步 (使用 ApiConfig 模块)

### 5.2 边界情况测试
- [ ] 测试断网场景
- [ ] 测试 API Key 无效场景
- [ ] 测试额度耗尽场景
- [ ] 测试连续快速滑动
