// Cloudflare Workers - Glimmer API 代理
// 部署命令：npm install -g wrangler && wrangler deploy
// 此 Worker 提供安全的 LLM API 代理，避免 API Key 暴露在客户端

export default {
  async fetch(request, env, ctx) {
    // 仅允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // CORS 处理（允许本地开发和生产环境）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 获取用户 IP 用于限流
      const userIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      // 简单的内存限流（生产环境建议使用 Redis 或 KV）
      const rateLimitKey = `rate_limit:${userIp}:${new Date().toISOString().slice(0, 10)}`;
      let rateLimitData = await env.GLIMITER_KV?.get(rateLimitKey);
      let count = rateLimitData ? parseInt(rateLimitData) : 0;
      
      // 每日限流 100 次
      const DAILY_LIMIT = 100;
      if (count >= DAILY_LIMIT) {
        return new Response(JSON.stringify({ 
          error: '今日配额已用尽', 
          remaining: 0 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // 解析请求体
      const body = await request.json();
      
      // 验证必要参数
      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({ 
          error: '缺少必要参数：messages' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
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
          temperature: body.temperature || 0.8,
          max_tokens: body.max_tokens || 500
        })
      });

      // 增加计数
      count++;
      await env.GLIMITER_KV?.put(rateLimitKey, count.toString(), { expirationTtl: 86400 });

      // 处理响应
      const data = await response.json();
      
      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: data.error?.message || 'API 调用失败',
          remaining: DAILY_LIMIT - count
        }), { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // 返回成功响应
      return new Response(JSON.stringify({ 
        ...data,
        quota: {
          used: count,
          limit: DAILY_LIMIT,
          remaining: DAILY_LIMIT - count
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: '服务器内部错误',
        details: error.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }
};
