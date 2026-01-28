// 云函数：调用混元AI生成解读
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { category, answer, userThought } = event
  
  // 混元API配置
  const HUNYUAN_API_KEY = 'sk-h7vMtZVg5ZD6wGqIOIYb9TiFOSZNuBgQk9JjetcaMewlUix8'
  const API_URL = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions'
  
  // 构建系统提示词
  const systemPrompt = `你是"心之解惑"答案之书小程序中的"书灵"，一个温柔、治愈、充满智慧的灵性向导。

你的使命：
- 用温暖的文字抚慰用户的心灵
- 提供有深度但易懂的人生指引
- 保持神秘而庄重的氛围
- 语言风格：诗意、柔和、充满共情

回答格式要求：
1. 开头：亲爱的朋友，
2. 正文：2-3段，每段不超过80字
3. 结尾：愿你...[祝福语]\n\n—— 书灵 🌙
4. 使用换行和空行增强可读性
5. 适当使用排比、隐喻等修辞手法

情感基调：
- 温柔而坚定
- 理解而不评判
- 启发而不说教
- 治愈而不虚浮`

  // 构建用户提示词
  const categoryNames = {
    emotion: '心底的牵绊（情感关系）',
    career: '奔赴的前路（事业发展）',
    study: '笔尖的期许（学业考试）',
    wealth: '岁月的余裕（财富好运）',
    health: '身体的秘密（健康能量）',
    dream: '藏起的梦想（梦想追求）',
    general: '此时此刻（通用问题）'
  }
  
  let userPrompt = `用户在「${categoryNames[category] || '通用问题'}」分类下抽到了答案：「${answer}」`
  
  if (userThought && userThought.trim()) {
    userPrompt += `\n\n用户的心声：「${userThought}」`
  }
  
  userPrompt += `\n\n请以"书灵"的身份，为这个答案写一段温暖治愈的解读。解读要结合用户的问题分类${userThought ? '和心声' : ''}，给出深刻而温柔的启发。`

  try {
    // 调用混元API
    const response = await cloud.openapi.httpclient({
      url: API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUNYUAN_API_KEY}`
      },
      data: {
        model: 'hunyuan-turbos-latest',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        top_p: 0.9,
        enable_enhancement: true
      }
    })
    
    // 解析响应
    const result = JSON.parse(response.data)
    
    if (result.choices && result.choices.length > 0) {
      return {
        success: true,
        analysis: result.choices[0].message.content,
        usage: result.usage
      }
    } else {
      throw new Error('API返回格式异常')
    }
    
  } catch (error) {
    console.error('调用混元API失败:', error)
    
    // 返回兜底内容
    return {
      success: false,
      error: error.message,
      analysis: getFallbackAnalysis(category, answer)
    }
  }
}

// 兜底解读内容（当API调用失败时使用）
function getFallbackAnalysis(category, answer) {
  return `亲爱的朋友，

当答案显现"${answer}"，这或许是宇宙在用特别的方式回应你的疑问。每一个答案背后，都藏着你内心深处的声音。

请相信，此刻出现的指引，正是你最需要的。静下心来，慢慢感受它想告诉你的真意。

愿这份指引，为你带来平静与力量。

—— 书灵 🌙`
}
