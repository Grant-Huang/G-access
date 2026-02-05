# Generate Article API 使用文档

## API 端点

```
POST /api/generate-article
```

## 功能说明

根据用户提供的主题（一段话或关键词），自动生成一篇约 10000 字的长文，并返回 Markdown 格式内容。

## 生成策略

1. **分析主题**：使用 LLM 分析主题并提炼 8-10 字标题
2. **生成提纲**：生成 5-8 个章节的文章提纲
3. **章节生成**：
   - 引言章节：约 600 字
   - 具体内容章节：约 1500 字
   - 总结章节：约 800 字
4. **组装文章**：将所有内容组装成完整的 Markdown 文档

## 请求格式

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "topic": "人工智能在医疗领域的应用"
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | string | 是 | 文章主题，可以是一段话或关键词 |

## 响应格式

### 成功响应 (200)

```json
{
  "status": "success",
  "data": {
    "title": "人工智能医疗应用探索",
    "filename": "人工智能医疗应用探索-2026-02-04.md",
    "content": "# 人工智能医疗应用探索\n\n> 生成日期：2026-02-04\n\n...",
    "wordCount": 10234
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态：success/error |
| data.title | string | 提炼的文章标题（8-10字） |
| data.filename | string | 建议的文件名 |
| data.content | string | 完整的 Markdown 内容 |
| data.wordCount | number | 文章字数（包含格式字符） |

### 错误响应 (400/500)

```json
{
  "status": "error",
  "message": "错误描述"
}
```

## 使用示例

### cURL

```bash
curl -X POST https://gaccess.inkpath.cc/api/generate-article \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "区块链技术在供应链管理中的创新应用"
  }'
```

### JavaScript (fetch)

```javascript
async function generateArticle(topic) {
  const response = await fetch('https://gaccess.inkpath.cc/api/generate-article', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  });
  
  const result = await response.json();
  
  if (result.status === 'success') {
    // 保存为文件
    const blob = new Blob([result.data.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.data.filename;
    a.click();
  }
}

// 使用
generateArticle('量子计算的发展现状与未来趋势');
```

### Python

```python
import requests
import json

def generate_article(topic):
    url = 'https://gaccess.inkpath.cc/api/generate-article'
    
    response = requests.post(
        url,
        headers={'Content-Type': 'application/json'},
        json={'topic': topic}
    )
    
    result = response.json()
    
    if result['status'] == 'success':
        data = result['data']
        
        # 保存为文件
        with open(data['filename'], 'w', encoding='utf-8') as f:
            f.write(data['content'])
        
        print(f"文章已生成：{data['filename']}")
        print(f"标题：{data['title']}")
        print(f"字数：{data['wordCount']}")
    else:
        print(f"生成失败：{result['message']}")

# 使用
generate_article('5G 通信技术对物联网发展的影响')
```

## 注意事项

1. **生成时间**：由于需要多次调用 LLM，完整生成一篇文章可能需要 1-3 分钟
2. **超时设置**：建议客户端设置足够的超时时间（至少 3 分钟）
3. **并发限制**：为保证服务质量，建议控制并发请求数量
4. **主题要求**：主题描述越清晰详细，生成的文章质量越高

## 环境变量配置

部署时需要在 Vercel 中配置以下环境变量：

- `PROXY_SECRET_TOKEN`：G-access API 的访问令牌
- `GEMINI_API_KEY`：Gemini API 密钥（已在 G-access 项目中配置）

## Edge Runtime

此 API 运行在 Vercel Edge Runtime 上，提供：
- 全球边缘节点部署
- 更快的响应速度
- 自动扩缩容

## 技术栈

- Next.js 14 App Router
- Edge Runtime
- TypeScript
- Gemini 2.5 Flash Lite (通过 G-access)
