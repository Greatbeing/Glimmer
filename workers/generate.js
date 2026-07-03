// Cloudflare Workers - Glimmer API 代理
// 部署命令：npm install -g wrangler && wrangler deploy
// 此 Worker 提供安全的 LLM API 代理，避免 API Key 暴露在客户端

export default {
  async fetch(request, env, ctx) {
    // CORS 处理（允许本地开发和生产环境）
    const corsHeaders = {
      'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
      'Access-Control-Max-Age': '86400'
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 仅允许 POST 请求
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      if (!env.ALIYUN_API_KEY) {
        return jsonResponse({ error: '服务未配置 API Key' }, 500, corsHeaders);
      }

      // 获取用户 IP 用于限流
      const userIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      // 简单的内存限流（生产环境建议使用 Redis 或 KV）
      const rateLimitKey = `rate_limit:${userIp}:${new Date().toISOString().slice(0, 10)}`;
      let rateLimitData = await env.GLIMITER_KV?.get(rateLimitKey);
      let count = rateLimitData ? parseInt(rateLimitData) : 0;
      
      // 每日限流，默认 100 次
      const DAILY_LIMIT = parsePositiveInt(env.DAILY_LIMIT, 100);
      if (count >= DAILY_LIMIT) {
        return jsonResponse({
          error: '今日配额已用尽',
          remaining: 0
        }, 429, corsHeaders);
      }

      // 解析请求体
      const body = await request.json();
      
      // 验证必要参数
      if (!body.messages || !Array.isArray(body.messages)) {
        return jsonResponse({
          error: '缺少必要参数：messages'
        }, 400, corsHeaders);
      }

      // 调用实际的 LLM API（这里以阿里云为例）
      const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ALIYUN_API_KEY}` // 从环境变量读取，不暴露给客户端
        },
        body: JSON.stringify({
          model: body.model || 'qwen-plus',
          messages: body.messages,
          temperature: body.temperature ?? 0.8,
          max_tokens: body.max_tokens ?? 500
        })
      });

      // 增加计数
      count++;
      await env.GLIMITER_KV?.put(rateLimitKey, count.toString(), { expirationTtl: 86400 });

      // 处理响应
      const data = await response.json();
      
      if (!response.ok) {
        return jsonResponse({
          error: data.error?.message || 'API 调用失败',
          remaining: DAILY_LIMIT - count
        }, response.status, corsHeaders);
      }

      // 返回成功响应
      return jsonResponse({
        ...data,
        quota: {
          used: count,
          limit: DAILY_LIMIT,
          remaining: DAILY_LIMIT - count
        }
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: '服务器内部错误'
      }, 500, corsHeaders);
    }
  }
};

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '*';
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  if (!allowed.length) return '*';
  return allowed.includes(origin) ? origin : allowed[0];
}
