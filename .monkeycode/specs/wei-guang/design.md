# 技术设计文档 - 微光应用

## 基本信息

- **应用名称**：微光
- **创意定位**：每日微光，照亮心房
- **更新日期**：2026-04-30

## 概述

微光是一款移动端优先的每日金句语录推荐与发布平台。应用提供三大核心功能：每日推荐（浏览和捕捉金句）、今日发布（发布灵感心事）和个人空间（管理收藏和发布内容）。

## 界面架构

```
┌─────────────────────────────────┐
│           顶部导航栏             │
│      "微光" Logo + 日期          │
├─────────────────────────────────┤
│                                 │
│                                 │
│         主内容区域                │
│    (根据导航切换显示不同模块)      │
│                                 │
│                                 │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │每日 │  │今日 │  │我的 │    │
│  │推荐 │  │发布 │  │空间 │    │
│  └─────┘  └─────┘  └─────┘    │
│         底部导航栏               │
└─────────────────────────────────┘
```

## 页面结构

### 1. 每日推荐页（首页）

```
┌─────────────────────────────────┐
│  ◀ 微光          2026年4月30日  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │     金句内容区域           │  │
│  │     (大字展示)             │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  │     —— 出处/来源          │  │
│  │                           │  │
│  │  ♡ 999  💬 88  ⭐ 56     │  │
│  │                      🎵   │  │
│  └───────────────────────────┘  │
│                                 │
│     ↑ 向上滑动查看下一条         │
└─────────────────────────────────┘
```

### 2. 今日发布页

```
┌─────────────────────────────────┐
│        今日发布                   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  ✏️ 分享今日心情...        │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ 用户名A · 3分钟前          │  │
│  │ 发布内容...                │  │
│  │ [开心]                     │  │
│  │ ♡ 12  💬 3                │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 用户名B · 10分钟前          │  │
│  │ 发布内容...                │  │
│  │ [感悟]                     │  │
│  │ ♡ 8   💬 1                │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 3. 个人空间页

```
┌─────────────────────────────────┐
│       👤 用户名                  │
├─────────────────────────────────┤
│  ┌────────┐ ┌────────┐        │
│  │ 捕捉 12 │ │ 发布 5  │        │
│  │ ❤️ 156 │ │ 💬 89  │        │
│  └────────┘ └────────┘        │
├─────────────────────────────────┤
│  [我的捕捉] [我的发布]           │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │     金句内容卡片           │  │
│  │     —— 来源               │  │
│  │                      ⭐   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## 组件设计

### 核心组件

| 组件名 | 说明 | 状态 |
|--------|------|------|
| QuoteCard | 金句卡片，展示单条金句信息 | default, loading, error |
| MusicPlayer | 背景音乐播放器 | playing, paused, loading |
| LikeButton | 点赞按钮 | liked, unliked, loading |
| CommentSection | 评论区组件 | expanded, collapsed |
| PublishInput | 发布输入框 | default, focused, submitting |
| PostCard | 发布内容卡片 | default, editing |
| TabSwitch | 标签页切换 | tab1 active, tab2 active |
| BottomNav | 底部导航栏 | - |
| HeaderBar | 顶部导航栏 | - |

### 组件状态详情

#### QuoteCard

```javascript
{
  id: string,
  content: string,           // 金句内容
  source: {
    type: 'ai' | 'book' | 'movie' | 'tv',  // 来源类型
    name: string,           // 具体来源名称
    author: string           // 作者/导演等
  },
  music: {
    url: string,             // 音乐URL
    name: string,            // 音乐名称
    artist: string           // 艺术家
  },
  likeCount: number,
  commentCount: number,
  isLiked: boolean,
  isCaught: boolean          // 是否已捕捉
}
```

#### PostCard

```javascript
{
  id: string,
  userId: string,
  username: string,
  content: string,
  mood: string | null,       // 心情标签
  createTime: timestamp,
  likeCount: number,
  commentCount: number,
  isLiked: boolean,
  comments: Comment[]         // 评论列表
}
```

## 数据模型

### localStorage 数据结构

```javascript
{
  // 用户信息
  user: {
    id: string,
    username: string,
    avatar: string
  },

  // 捕捉的金句列表
  caughtQuotes: QuoteCard[],

  // 发布的內容列表
  myPosts: PostCard[],

  // 点赞记录（用于防止重复点赞）
  likeRecords: {
    quotes: string[],        // 已点赞的金句ID
    posts: string[]          // 已点赞的发布ID
  },

  // 评论记录
  comments: {
    [quoteId]: Comment[],
    [postId]: Comment[]
  }
}
```

### 金句数据（预置+动态）

```javascript
// 预置金句池
const quotePool = [
  {
    id: 'q001',
    content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。',
    source: {
      type: 'book',
      name: '思考致富',
      author: '拿破仑·希尔'
    },
    music: {
      url: '/music/calm-piano.mp3',
      name: '宁静钢琴曲',
      artist: '轻音乐团'
    }
  },
  // ... 更多预置金句
];

// 大模型生成金句（模拟）
function generateAIQuote() {
  const themes = ['希望', '坚持', '爱', '成长', '勇气'];
  const theme = themes[Math.floor(Math.random() * themes.length)];
  return {
    id: 'ai_' + Date.now(),
    content: `在人生的旅途中，${theme}是那束最温暖的光...`,
    source: {
      type: 'ai',
      name: '微光 AI',
      author: '智能生成'
    },
    music: generateMatchingMusic(theme)
  };
}
```

## 核心功能实现

### 1. 金句音乐匹配

```javascript
function generateMatchingMusic(theme) {
  const musicMap = {
    '希望': { url: '/music/hope.mp3', name: '希望的曙光', artist: '轻音乐团' },
    '坚持': { url: '/music/perseverance.mp3', name: '坚持的力量', artist: '轻音乐团' },
    '爱': { url: '/music/love.mp3', name: '爱的旋律', artist: '轻音乐团' },
    '成长': { url: '/music/growth.mp3', name: '成长的脚步', artist: '轻音乐团' },
    '勇气': { url: '/music/courage.mp3', name: '勇气的赞歌', artist: '轻音乐团' }
  };
  return musicMap[theme] || musicMap['希望'];
}
```

### 2. 滑动切换

```javascript
let startY = 0;
let endY = 0;

card.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

card.addEventListener('touchend', (e) => {
  endY = e.changedTouches[0].clientY;
  handleSwipe();
});

function handleSwipe() {
  const diff = startY - endY;
  const threshold = 50;

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // 向上滑动 - 下一条
      showNextQuote();
    } else {
      // 向下滑动 - 上一条
      showPrevQuote();
    }
  }
}
```

### 3. 捕捉微光动效

```javascript
function triggerCatchEffect() {
  const particle = document.createElement('div');
  particle.className = 'catch-particle';
  particle.innerHTML = '✨';
  document.body.appendChild(particle);

  // 粒子动画
  particle.animate([
    { transform: 'scale(1) translateY(0)', opacity: 1 },
    { transform: 'scale(1.5) translateY(-100px)', opacity: 0 }
  ], {
    duration: 800,
    easing: 'ease-out'
  }).onfinish = () => particle.remove();
}
```

## 样式设计

### 主题变量

```css
:root {
  /* 主色调 - 暖色微光 */
  --primary: #FF9B50;
  --primary-light: #FFB067;
  --primary-dark: #E8850;

  /* 背景色 */
  --bg-main: #FFF8F0;
  --bg-card: #FFFFFF;

  /* 文字色 */
  --text-primary: #2D2D2D;
  --text-secondary: #666666;
  --text-muted: #999999;

  /* 强调色 */
  --accent-like: #FF6B6B;
  --accent-catch: #FFD93D;
  --accent-comment: #6BCB77;

  /* 阴影 */
  --shadow-card: 0 4px 20px rgba(255, 155, 80, 0.15);
  --shadow-button: 0 2px 8px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  /* 动画 */
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

### 金句卡片样式

```css
.quote-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 32px 24px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  transition: transform var(--transition-normal);
}

.quote-card:active {
  transform: scale(0.98);
}

.quote-content {
  font-size: 24px;
  line-height: 1.8;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 24px;
}

.quote-source {
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
}
```

## 技术实现

### 文件结构

```
/workspace/
├── index.html           # 单页应用入口
├── styles/
│   ├── main.css        # 主样式文件
│   ├── components.css  # 组件样式
│   └── animations.css  # 动画样式
├── scripts/
│   ├── app.js          # 应用主逻辑
│   ├── data.js         # 数据管理
│   ├── components.js   # UI组件
│   └── utils.js        # 工具函数
├── assets/
│   └── music/          # 背景音乐
└── .monkeycode/
    └── specs/
        └── wei-guang/  # 规格文档
```

### 状态管理

```javascript
// 简单的状态管理
const AppState = {
  currentPage: 'recommend',  // recommend | publish | space
  currentQuoteIndex: 0,
  quotes: [],
  caughtQuotes: [],
  myPosts: [],
  isPlaying: false
};
```

## 正确性保证

### 数据一致性

1. 捕捉金句时，同时更新 `caughtQuotes` 和 `likeRecords.quotes`
2. 点赞时，先检查 `likeRecords` 防止重复点赞
3. 发布内容时，自动生成时间戳和唯一ID

### 边界条件

1. 金句列表滑动到边界时，循环展示
2. 发布内容为空时，禁止提交
3. 评论内容为空时，禁止提交
4. 音乐加载失败时，显示静默降级

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 音乐加载失败 | 隐藏音乐播放按钮，静默降级 |
| 数据存储失败 | 提示用户并重试 |
| 空数据状态 | 显示友好提示和引导 |
| 网络超时 | 显示重试按钮 |

## 测试策略

### 功能测试

1. 金句滑动切换流畅性
2. 点赞/取消点赞状态正确
3. 捕捉微光动效正常
4. 发布内容功能完整
5. 个人空间数据同步

### 兼容性测试

1. iOS Safari 全面屏适配
2. Android Chrome 全面屏适配
3. 各种屏幕尺寸响应式布局

## 参考资料

- 移动端手势交互设计规范
- 无障碍访问指南
