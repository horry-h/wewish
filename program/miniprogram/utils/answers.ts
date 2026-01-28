// utils/answers.ts

/**
 * 答案池配置
 */
export const answerPool: Record<string, string[]> = {
  // ✨ 此时此刻（原通用）
  general: [
    '是的', '不', '或许', '时机未到',
    '听从直觉', '再想想', '问问身边人', '相信自己',
    '顺其自然', '积极行动', '保持观望', '寻求平衡'
  ],
  
  // 🍂 关于感情
  emotion: [
    '勇敢表达', '保持沉默', '顺其自然', '主动出击', 
    '给彼此空间', '坦诚相待', '暂时观望', '倾听内心',
    '放下执念', '珍惜当下', '给时间时间', '信任感觉'
  ],
  
  // 🛤️ 工作与事业
  career: [
    '现在就去做', '再等等', '寻求帮助', '独立完成',
    '调整方向', '坚持初心', '适时放弃', '学习充电',
    '大胆尝试', '谨慎评估', '相信自己', '团队协作'
  ],
  
  // 📖 学业与考试
  study: [
    '专注当下', '劳逸结合', '寻找方法', '请教他人',
    '制定计划', '突破瓶颈', '回归基础', '保持耐心',
    '温故知新', '举一反三', '实践检验', '循序渐进'
  ],
  
  // 💰 财富与好运
  wealth: [
    '谨慎投资', '大胆尝试', '守住本金', '分散风险',
    '长期持有', '及时止损', '学习理财', '稳中求进',
    '量入为出', '开源节流', '价值投资', '耐心等待'
  ],
  
  // 🌿 身体与能量
  health: [
    '倾听身体', '适当休息', '规律作息', '温和运动',
    '调整饮食', '释放压力', '寻求帮助', '顺应自然',
    '不必强求', '循序渐进', '保持平衡', '善待自己'
  ],
  
  // 🎈 心中的梦想
  dream: [
    '勇敢开始', '时机已到', '不留遗憾', '相信自己',
    '小步前进', '允许失败', '享受过程', '放下顾虑',
    '此刻就做', '无需完美', '给自己机会', '值得尝试'
  ]
}

/**
 * 每日签文
 */
export const dailyFortunes: string[] = [
  '今日宜静心,诸事渐明',
  '顺其自然,水到渠成',
  '内心笃定,万事可期',
  '今日宜思考,勿急于行动',
  '相信直觉,答案就在心中',
  '今日宜放下执念,海阔天空',
  '大道至简,返璞归真',
  '心有所向,日复一日',
  '凡事皆有裂痕,那是光进来的地方',
  '此刻即是答案,当下即是永恒'
]

/**
 * 禅语库
 */
export const zenQuotes: string[] = [
  '万物皆有裂痕,那是光照进来的地方',
  '此刻的犹豫,正在为未来铺路',
  '答案从不迟到,只是时机未至',
  '内心的声音,最为真实',
  '静下心来,答案自会显现',
  '每一次提问,都是在靠近真相',
  '不确定性中,藏着无限可能',
  '听见内心,便已找到答案'
]

/**
 * 生成随机答案(带权重)
 */
export function getWeightedAnswer(category: string): string {
  const answers = answerPool[category] || answerPool.general
  
  // 简单随机(可扩展为加权随机)
  const randomIndex = Math.floor(Math.random() * answers.length)
  return answers[randomIndex]
}

/**
 * 获取每日签文(基于日期)
 */
export function getDailyFortune(): string {
  const today = new Date()
  const seed = today.getFullYear() + today.getMonth() + today.getDate()
  const index = seed % dailyFortunes.length
  return dailyFortunes[index]
}

/**
 * 简化的农历日期(仅供展示)
 */
export function getLunarDate(): string {
  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '冬月', '腊月']
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                     '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                     '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  
  const today = new Date()
  // 这里使用简化算法,实际应使用专业的农历转换库
  const monthIndex = today.getMonth()
  const dayIndex = Math.min(today.getDate() - 1, 29)
  
  return `农历${lunarMonths[monthIndex]}${lunarDays[dayIndex]}`
}
