# Glimmer API Workers - 后端代理

为了解决 API Key 暴露在客户端的安全问题，本项目提供了 Cloudflare Workers 后端代理方案。

## 🔒 为什么需要后端代理？

### 当前问题
```javascript
// ❌ 客户端直接调用 LLM API
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${userApiKey}` }
});
```

**风险**:
- API Key 暴露在浏览器 Network 面板
- 可能被恶意用户窃取滥用
- 无法进行统一的限流和审计
- 用户需要自行配置 API Key，体验较差

### 解决方案
```javascript
// ✅ 通过 Workers 代理
const response = await fetch('https://glimmer-api.your-domain.workers.dev', {
  method: 'POST',
  body: JSON.stringify({ category: 'literature' })
  // 不需要传递 API Key！
});
```

**优势**:
- API Key 完全保存在服务端（Cloudflare）
- 用户可以免费使用，无需配置
- 统一的限流控制（每 IP 每日 100 次）
- 可以添加日志、监控、统计等功能

---

## 🚀 快速部署

### 前置要求

1. **Cloudflare 账号** - [免费注册](https://dash.cloudflare.com/sign-up)
2. **LLM API Key** - 阿里云/智谱/百度等

### 步骤 1: 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 步骤 2: 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，点击 Allow 即可。

### 步骤 3: 创建 KV 命名空间

KV 用于存储限流计数：

```bash
wrangler kv:namespace create "GLIMITER_KV"
```

输出示例：
```json
{
  "id": "a1b2c3d4e5f6g7h8i9j0",
  "title": "glimmer-api-glimmer_kv"
}
```

**复制 `id` 值**，更新 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "GLIMITER_KV"
id = "a1b2c3d4e5f6g7h8i9j0"  # 替换为你的 ID
```

### 步骤 4: 设置 API Key

使用 `wrangler secret` 安全地存储 API Key：

```bash
wrangler secret put ALIYUN_API_KEY
```

输入你的阿里云 API Key（或其他 LLM 提供商的 Key）。

### 步骤 5: 部署

```bash
wrangler deploy
```

部署成功后会显示 Worker 地址，例如：
```
https://glimmer-api.your-subdomain.workers.dev
```

---

## 📝 前端配置

部署完成后，修改前端的 API 配置：

### 方式 1: 在设置面板中配置

1. 打开 Glimmer 应用
2. 点击右上角 ⚙ 设置图标
3. 将 API 地址改为你的 Worker 地址
4. API Key 留空（不再需要）

### 方式 2: 修改默认配置

在 `index.html` 中找到 `apiConfig`：

```javascript
const apiConfig = {
  baseUrl: 'https://glimmer-api.your-subdomain.workers.dev',  // 你的 Worker 地址
  key: '',  // 留空
  model: 'qwen-plus'
};
```

---

## ⚙️ 高级配置

### 自定义域名

如果想使用自己的域名而非 `.workers.dev`：

1. 在 Cloudflare Dashboard 中添加自定义域名
2. 绑定到 Worker
3. 更新前端配置

### 调整限流额度

编辑 `workers/generate.js`：

```javascript
const DAILY_LIMIT = 100;  // 修改为你想要的额度
```

重新部署：
```bash
wrangler deploy
```

### 更换 LLM 提供商

默认使用阿里云通义千问，如需更换：

1. 修改 `workers/generate.js` 中的 `API_URL`
2. 更新环境变量名称（如 `OPENAI_API_KEY`）
3. 重新设置 secret：
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

---

## 📊 监控与日志

### 查看实时日志

```bash
wrangler tail
```

### 查看用量统计

在 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Analytics

可以看到：
- 请求总数
- 错误率
- 响应时间
- 按地区分布

---

## 💰 成本估算

Cloudflare Workers 免费额度：
- **每日请求数**: 100,000 次
- **计算时间**: 10ms CPU 时间/请求

假设每次 LLM 调用平均 50ms：
- 免费额度可支持约 **20,000 次/日** LLM 调用
- 超出后 $0.30 / 百万请求

对于个人项目，免费额度通常足够。

---

## 🔧 故障排查

### 部署失败

```bash
# 查看详细错误
wrangler deploy --dry-run

# 清除缓存重试
rm -rf .wrangler
wrangler deploy
```

### API 调用失败

1. 检查 KV 命名空间 ID 是否正确
2. 确认 API Key 已正确设置：
   ```bash
   wrangler secret list
   ```
3. 查看日志：
   ```bash
   wrangler tail --live
   ```

### CORS 错误

确保 Worker 返回了正确的 CORS 头：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

---

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)

---

## 🆚 与其他方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Cloudflare Workers** | 免费额度高、全球 CDN、零运维 | 需要 Cloudflare 账号 |
| Vercel Functions | 部署简单、Git 集成 | 免费额度较低 |
| 自建服务器 | 完全可控 | 成本高、需运维 |
| 客户端直连 | 最简单 | **API Key 暴露** |

**推荐**: 个人项目首选 Cloudflare Workers，成本低、性能好、安全性高。

---

## 📄 License

MIT
