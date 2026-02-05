# G-Access - Minimal Gemini API Proxy

极简、高性能 Gemini API 私有代理服务，专为 Vercel Edge Runtime 优化。

## 功能特性

- ✅ **Gemini API 代理**：安全的 Gemini API 访问代理
- ✅ **长文生成**：基于主题自动生成 10000 字长文（新功能）
- ✅ Edge Runtime：全球边缘节点部署
- ✅ 零配置：开箱即用

## API 端点

### 1. Gemini API 代理
```
POST /api/gemini
```
简单的 Gemini API 代理，支持 Bearer Token 认证。

**详细文档**：见下文 "核心代码" 部分

### 2. 长文生成 API（新）
```
POST /api/generate-article
```
根据主题自动生成约 10000 字的长文，返回 Markdown 格式。

**详细文档**：[API_USAGE.md](./API_USAGE.md)

**快速示例**：
```bash
curl -X POST https://gaccess.inkpath.cc/api/generate-article \
  -H "Content-Type: application/json" \
  -d '{"topic": "人工智能的发展与未来"}'
```

## 文件结构

```
G-access/
├── app/
│   ├── api/
│   │   ├── gemini/
│   │   │   └── route.ts           # POST /api/gemini 处理器
│   │   └── generate-article/
│   │       └── route.ts           # POST /api/generate-article 处理器
│   ├── layout.tsx                 # 根布局
│   └── page.tsx                   # 首页
├── .gitignore
├── API_USAGE.md                   # 长文生成 API 文档
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json                    # Vercel 配置
```

## 核心代码

### `app/api/gemini/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  // 1. 验证 Authorization Header
  const authHeader = request.headers.get('authorization')
  const proxyToken = process.env.PROXY_SECRET_TOKEN

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  if (token !== proxyToken) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }

  // 2. 解析请求体
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt field' },
        { status: 400 }
      )
    }

    // 3. 调用 Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    // 4. 直接透传响应
    const data = await geminiResponse.json()

    if (!geminiResponse.ok) {
      return NextResponse.json(data, { status: geminiResponse.status })
    }

    return NextResponse.json(data)

  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}
```

## 环境变量

| 变量 | 描述 | 必填 |
|------|------|------|
| `GEMINI_API_KEY` | Gemini API Key | ✅ |
| `PROXY_SECRET_TOKEN` | 代理认证 Token | ✅ |

## 示例 curl 调用

```bash
# 设置环境变量
export PROXY_SECRET_TOKEN="your_secret_token"
export GEMINI_API_KEY="your_gemini_api_key"

# 调用代理接口
curl -X POST https://your-project.vercel.app/api/gemini \
  -H "Authorization: Bearer $PROXY_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, Gemini!"}'

# 响应示例
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "Hello! How can I help you today?" }]
      }
    }
  ]
}
```

## Vercel 部署步骤

### 1. 创建 Vercel 项目

```bash
# 本地初始化
cd G-access
npm install

# 本地测试
npm run dev
```

### 2. 部署到 Vercel

**方式一：Vercel CLI**
```bash
npm i -g vercel
vercel
```

**方式二：Git 集成**
1. 推送代码到 GitHub
2. 访问 https://vercel.com/new
3. 导入 G-access 仓库
4. 配置环境变量

### 3. 配置环境变量

在 Vercel Dashboard 中添加：

| 变量名 | 值 |
|--------|-----|
| `GEMINI_API_KEY` | `AIzaSy...` (你的 Gemini API Key) |
| `PROXY_SECRET_TOKEN` | 自定义 Token |

### 4. 测试部署

```bash
# 替换为你的 Vercel 项目 URL
export PROXY_SECRET_TOKEN="your_secret_token"

curl -X POST https://your-project.vercel.app/api/gemini \
  -H "Authorization: Bearer $PROXY_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'
```

## 设计目标

| 目标 | 实现方式 |
|------|----------|
| 代码最少 | ~50 行核心逻辑 |
| 依赖最少 | 仅 Next.js + React |
| 冷启动最小 | Edge Runtime |
| 响应最快 | 直接透传，无处理 |

## License

MIT
