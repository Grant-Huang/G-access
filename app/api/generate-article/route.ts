import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 定义生成文章的请求接口
interface GenerateArticleRequest {
  topic: string
}

// 定义 Gemini API 响应结构
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

// 调用 G-access API 的工具函数
async function callGemini(prompt: string): Promise<string> {
  const proxyToken = process.env.PROXY_SECRET_TOKEN
  
  if (!proxyToken) {
    throw new Error('PROXY_SECRET_TOKEN not configured')
  }

  const response = await fetch('https://gaccess.inkpath.cc/api/gemini', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${proxyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`G-access API error: ${response.status} - ${error}`)
  }

  const data: GeminiResponse = await response.json()
  
  // 提取文本内容
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!text) {
    throw new Error('No text content in response')
  }

  return text
}

// 提炼主题标题（8-10字）
async function extractTitle(topic: string): Promise<string> {
  const prompt = `请根据以下主题，提炼出一个8-10字的精简标题，只返回标题文字，不要其他内容：

主题：${topic}`

  const title = await callGemini(prompt)
  return title.trim().replace(/["'"「」《》]/g, '')
}

// 生成文章提纲
async function generateOutline(topic: string): Promise<string[]> {
  const prompt = `请为以下主题生成一个文章提纲，要求：
1. 包含5-8个章节
2. 第一章可以是引言或概述
3. 中间章节是具体内容展开
4. 最后一章是总结或展望
5. 每个章节只返回标题，不要编号
6. 每行一个章节标题

主题：${topic}

请直接返回章节标题列表，每行一个，不要其他说明文字。`

  const outlineText = await callGemini(prompt)
  
  // 解析提纲，每行一个章节
  const chapters = outlineText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.startsWith('#')) // 过滤掉可能的标题标记
    .map(line => line.replace(/^[\d、.-]+\s*/, '')) // 移除可能的编号
    .slice(0, 8) // 最多8章
  
  return chapters
}

// 生成单个章节内容
async function generateChapter(topic: string, chapterTitle: string, chapterIndex: number, totalChapters: number): Promise<string> {
  // 判断是否是引言或总结章节
  const isIntro = chapterIndex === 0
  const isConclusion = chapterIndex === totalChapters - 1
  
  let wordCount = 1500 // 默认字数
  
  if (isIntro) {
    wordCount = 600 // 引言较短
  } else if (isConclusion) {
    wordCount = 800 // 总结中等
  }

  const prompt = `请根据以下信息撰写文章章节内容：

主题：${topic}
章节标题：${chapterTitle}
章节位置：第 ${chapterIndex + 1} 章，共 ${totalChapters} 章
要求字数：约 ${wordCount} 字

写作要求：
1. 内容充实，逻辑清晰
2. 使用 Markdown 格式
3. 可以包含小标题（使用 ### ）
4. ${isIntro ? '作为引言，简要介绍背景和主题' : ''}
5. ${isConclusion ? '作为总结，概括要点并展望未来' : ''}
6. 不要重复章节标题

请直接返回章节内容，不要其他说明。`

  const content = await callGemini(prompt)
  return content.trim()
}

// 主函数：生成完整文章
async function generateFullArticle(topic: string): Promise<{ title: string; content: string; filename: string }> {
  try {
    // 步骤1：提炼标题
    console.log('Extracting title...')
    const title = await extractTitle(topic)
    
    // 步骤2：生成提纲
    console.log('Generating outline...')
    const chapters = await generateOutline(topic)
    
    if (chapters.length === 0) {
      throw new Error('Failed to generate outline')
    }
    
    // 步骤3：生成各章节内容
    console.log(`Generating ${chapters.length} chapters...`)
    const chapterContents: string[] = []
    
    for (let i = 0; i < chapters.length; i++) {
      console.log(`Generating chapter ${i + 1}/${chapters.length}: ${chapters[i]}`)
      const content = await generateChapter(topic, chapters[i], i, chapters.length)
      chapterContents.push(content)
      
      // 添加小延迟，避免请求过快
      if (i < chapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // 步骤4：组装完整文章
    const date = new Date().toISOString().split('T')[0]
    const filename = `${title}-${date}.md`
    
    let fullContent = `# ${title}\n\n`
    fullContent += `> 生成日期：${date}\n\n`
    fullContent += `## 目录\n\n`
    
    chapters.forEach((chapter, index) => {
      fullContent += `${index + 1}. ${chapter}\n`
    })
    
    fullContent += `\n---\n\n`
    
    chapters.forEach((chapter, index) => {
      fullContent += `## ${chapter}\n\n`
      fullContent += chapterContents[index]
      fullContent += `\n\n---\n\n`
    })
    
    return {
      title,
      content: fullContent,
      filename,
    }
    
  } catch (error) {
    console.error('Error generating article:', error)
    throw error
  }
}

// API 端点
export async function POST(request: NextRequest) {
  try {
    const body: GenerateArticleRequest = await request.json()
    const { topic } = body
    
    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty topic field' },
        { status: 400 }
      )
    }
    
    // 生成文章
    const result = await generateFullArticle(topic.trim())
    
    // 返回结果
    return NextResponse.json({
      status: 'success',
      data: {
        title: result.title,
        filename: result.filename,
        content: result.content,
        wordCount: result.content.length,
      },
    })
    
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
