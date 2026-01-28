// 统计各分类答案数量的脚本

const fullAnswerPool = [
  // 从 answers-new.ts 复制数据...
  // 这里使用正则表达式从文件中提取数据
]

// 7个分类维度
const categories = {
  emotion: '情感关系',
  career: '事业发展',
  study: '学习成长',
  wealth: '财富理财',
  health: '健康生活',
  dream: '梦想追求',
  general: '通用/日常'
}

// 3种类型
const types = {
  positive: '正向鼓励',
  neutral: '中性引导',
  cautious: '谨慎思考'
}

// 统计函数
function analyzeAnswers() {
  console.log('='.repeat(60))
  console.log('《心之解惑》答案库统计分析')
  console.log('='.repeat(60))
  console.log()
  
  // 读取文件内容并解析
  const fs = require('fs')
  const content = fs.readFileSync('../program/miniprogram/utils/answers-new.ts', 'utf-8')
  
  // 提取所有答案对象
  const answerRegex = /\{\s*id:\s*\d+,\s*text:\s*"([^"]+)",\s*tags:\s*\[([^\]]+)\],\s*type:\s*"(\w+)"\s*\}/g
  const answers = []
  let match
  
  while ((match = answerRegex.exec(content)) !== null) {
    const text = match[1]
    const tags = match[2].replace(/"/g, '').split(',').map(t => t.trim())
    const type = match[3]
    answers.push({ text, tags, type })
  }
  
  console.log(`📊 总答案数：${answers.length} 条\n`)
  
  // 按分类统计
  console.log('📂 各分类答案数量：')
  console.log('-'.repeat(60))
  const categoryStats = {}
  for (const [key, name] of Object.entries(categories)) {
    const count = answers.filter(a => a.tags.includes(key)).length
    categoryStats[key] = count
    console.log(`${name.padEnd(12, '　')}${key.padEnd(10)} : ${count.toString().padStart(4)} 条`)
  }
  console.log()
  
  // 按类型统计
  console.log('🎭 各类型答案数量：')
  console.log('-'.repeat(60))
  const typeStats = {}
  for (const [key, name] of Object.entries(types)) {
    const count = answers.filter(a => a.type === key).length
    typeStats[key] = count
    console.log(`${name.padEnd(12, '　')}${key.padEnd(10)} : ${count.toString().padStart(4)} 条`)
  }
  console.log()
  
  // 分类+类型交叉统计
  console.log('📊 分类×类型交叉统计：')
  console.log('-'.repeat(60))
  console.log('分类'.padEnd(12, '　') + '正向'.padStart(6) + '中性'.padStart(6) + '谨慎'.padStart(6) + '合计'.padStart(6))
  console.log('-'.repeat(60))
  
  for (const [catKey, catName] of Object.entries(categories)) {
    const positive = answers.filter(a => a.tags.includes(catKey) && a.type === 'positive').length
    const neutral = answers.filter(a => a.tags.includes(catKey) && a.type === 'neutral').length
    const cautious = answers.filter(a => a.tags.includes(catKey) && a.type === 'cautious').length
    const total = positive + neutral + cautious
    
    console.log(
      catName.padEnd(12, '　') +
      positive.toString().padStart(6) +
      neutral.toString().padStart(6) +
      cautious.toString().padStart(6) +
      total.toString().padStart(6)
    )
  }
  console.log()
  
  // 标签组合统计（最常见的组合）
  console.log('🏷️  标签组合 TOP 10：')
  console.log('-'.repeat(60))
  const tagCombos = {}
  answers.forEach(a => {
    const combo = a.tags.sort().join(', ')
    tagCombos[combo] = (tagCombos[combo] || 0) + 1
  })
  
  const sortedCombos = Object.entries(tagCombos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  sortedCombos.forEach(([combo, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${combo.padEnd(40)} : ${count} 条`)
  })
  console.log()
  
  // 平均标签数
  const avgTags = (answers.reduce((sum, a) => sum + a.tags.length, 0) / answers.length).toFixed(2)
  console.log(`📌 平均每条答案包含 ${avgTags} 个标签`)
  console.log()
  
  console.log('='.repeat(60))
  console.log('统计完成！')
  console.log('='.repeat(60))
}

analyzeAnswers()
