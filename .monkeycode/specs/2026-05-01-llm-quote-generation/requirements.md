# Requirements Document: LLM 无限语录生成

## Introduction

Glimmer 应用当前使用固定的 30 条预设语录。用户希望语录内容给人"无穷无尽"的感觉，通过调用 LLM API 动态生成新语录，确保用户每次打开应用都能看到新鲜内容。

## Glossary

- **Glimmer**: 每日语录推荐应用，提供 Web 端和微信小程序
- **LLM 语录**: 通过大语言模型 API 实时生成的语录内容
- **混合模式**: 预设语录 + LLM 生成语录混合展示的策略
- **缓存池**: 本地存储预生成的 LLM 语录，减少 API 调用频率
- **降级策略**: LLM API 不可用时回退到预设语录的机制

## Requirements

### Requirement 1: LLM 语录生成

**User Story:** AS 普通用户, I want 每次滑动都能刷到新鲜语录, so that 我获得持续的内容新鲜感而不会重复

#### Acceptance Criteria

1. WHEN 用户滑动到当前列表末尾, 系统 SHALL 调用 LLM API 生成一条新语录
2. 生成的语录 SHALL 包含中文正文、英文翻译、来源、作者、背景说明、标签、分类
3. 生成的语录 SHALL 从以下四类中随机选择: 哲学、心理学、反常识、励志
4. IF LLM API 调用失败, 系统 SHALL 回退到预设语录池
5. WHEN 连续三次 API 调用失败, 系统 SHALL 暂停生成请求 30 分钟

### Requirement 2: 本地缓存策略

**User Story:** AS 开发者, I want 预生成并缓存 LLM 语录, so that 减少 API 调用次数并降低响应延迟

#### Acceptance Criteria

1. 系统 SHALL 在后台预生成 10 条 LLM 语录并存储在 localStorage
2. WHEN 缓存数量低于 5 条, 系统 SHALL 自动补充生成至 10 条
3. 每条缓存语录 SHALL 在首次展示时才开始计时，24 小时内不重复展示
4. 缓存总容量 SHALL 限制为 50 条，超出时按时间淘汰最早条目

### Requirement 3: 去重机制

**User Story:** AS 用户, I want 不会在短期内看到重复语录, so that 每次体验都是独特的

#### Acceptance Criteria

1. 系统 SHALL 记录用户已展示的语录 ID（含预设和 LLM 生成）
2. 展示历史 SHALL 保留最近 200 条记录
3. IF LLM 生成的语录与展示历史重复, 系统 SHALL 丢弃并重新生成
4. 重复检测 SHALL 基于语录中文正文的相似度（阈值 80%）

### Requirement 4: 用户体验优化

**User Story:** AS 用户, I want 语录加载过程流畅自然, so that 我不需要等待或感知 API 调用的存在

#### Acceptance Criteria

1. WHEN 用户滑动到缓存最后 3 条时, 系统 SHALL 在后台预加载新语录
2. 新语录加载期间, 系统 SHALL 显示"正在寻找下一条微光..."加载状态
3. 加载超时时间 SHALL 设定为 5 秒，超时后自动展示预设语录
4. 每日首次打开应用时, 系统 SHALL 预生成 5 条当日专属语录

### Requirement 5: 成本控制

**User Story:** AS 应用运营者, I want 控制 LLM API 调用成本, so that 应用在可接受的预算范围内运行

#### Acceptance Criteria

1. 系统 SHALL 限制每日 LLM API 调用次数不超过 100 次
2. 每日调用额度 SHALL 在每日凌晨 0 点重置
3. WHEN 当日额度用尽, 系统 SHALL 完全切换至预设语录模式
4. 系统 SHALL 在控制台输出当日 API 调用次数和预估费用

## Non-Functional Requirements

1. LLM 生成响应时间 SHALL 低于 3 秒（P95）
2. 缓存命中率 SHALL 高于 80%
3. 应用 SHALL 在离线模式下正常使用预设语录
4. 生成语录的语言质量 SHALL 达到人工审核标准（无语法错误、语义通顺）
