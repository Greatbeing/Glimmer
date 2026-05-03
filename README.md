# Glimmer 微光 - 每日金句语录

> 每日微光，照亮心房

一个优雅的语录浏览应用，支持 Web 端和微信小程序。预设 30+ 精选金句，可接入 LLM API 无限生成高质量内容。

## ✨ 特性

- **30+ 精选金句** — 覆盖文学、哲学、心理学、反常识四大类别
- **LLM 无限生成** — 接入通义千问/智谱清言/文心一言，语录永不枯竭
- **智能缓存** — 自动生成、去重、预加载，流畅无等待
- **每日限额** — 100 次/日调用，合理控制 API 成本
- **降级保护** — API 不可用时自动回退到预设内容
- **暗色玻璃拟态** — 精致深邃的视觉体验
- **滑动交互** — 上下滑动切换语录，自然流畅

## 🌐 在线演示

https://greatbeing.github.io/Glimmer/

## 🖥️ Web 端

打开 [index.html](index.html) 即可在浏览器中运行。

### 首次使用

1. 点击右上角 ⚙ 图标打开 API 设置
2. 输入你的 LLM API Key
3. 选择模型（推荐通义千问 qwen-turbo）
4. 点击"保存并验证"

> API Key 仅存储在本地浏览器，不会上传到任何服务器。

### 支持的模型

| 模型 | 默认 API 地址 |
|------|-------------|
| 通义千问 (qwen-turbo) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 智谱清言 (glm-4) | `https://open.bigmodel.cn/api/paas/v4` |
| 文心一言 (ernie-bot) | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop` |

## 📱 小程序端

`miniprogram/` 目录包含微信小程序源码。

### 结构

```
miniprogram/
├── app.js / app.json / app.wxss    # 应用入口与全局配置
├── pages/
│   ├── index/                       # 首页 - 语录浏览
│   ├── publish/                     # 发布页 - 用户创作
│   └── space/                       # 我的空间 - 设置与收藏
├── utils/
│   └── quoteService.js              # LLM 核心模块
└── images/                          # 图标资源
```

### 核心模块 (quoteService.js)

| 模块 | 功能 |
|------|------|
| `ApiConfig` | API Key 管理，本地存储 |
| `QuotaManager` | 每日 100 次限额控制 |
| `QuoteCache` | 50 条缓存池 + 200 条历史记录 |
| `QuoteGenerator` | LLM 语录生成，支持多模型 |
| `QuoteRouter` | 降级链路调度，熔断保护 |

## 🏗️ 架构

```
┌─────────────────────────────────────┐
│            用户交互层                 │
│  滑动/点击/设置面板                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         QuoteRouter                  │
│  降级: 缓存 → API → 预设             │
│  熔断: 3次失败暂停30分钟              │
└──────┬──────────┬──────────┬────────┘
       │          │          │
┌──────▼──┐ ┌─────▼────┐ ┌──▼───────┐
│Cache    │ │Generator │ │Presets   │
│预加载   │ │多模型    │ │30+条     │
│去重     │ │Prompt    │ │分类      │
└─────────┘ └────┬─────┘ └──────────┘
                 │
          ┌──────▼──────┐
          │ LLM API     │
          │ OpenAI 格式 │
          └─────────────┘
```

## 🚀 本地开发

```bash
# Web 端 - 直接用浏览器打开
open index.html

# 或使用任意 HTTP 服务器
npx serve .
python3 -m http.server 8080
```

## 📋 技术栈

- **Web 端**: 纯 HTML/CSS/JS，零依赖单文件应用
- **小程序端**: 微信小程序原生框架
- **LLM 适配**: OpenAI 兼容 API 格式

## 📝 License

MIT
