// pages/daily/daily.ts
import { getDailyFortune, getLunarDate } from '../../utils/answers'

Page({
  data: {
    statusBarHeight: 44,
    dailyFortune: '',
    lunarDate: '',
    solarDate: '',
    interpretation: ''
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    const today = new Date()
    
    // 格式化公历日期
    const solarDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    
    // 生成解签
    const interpretation = this.getInterpretation(getDailyFortune())

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 44,
      dailyFortune: getDailyFortune(),
      lunarDate: getLunarDate(),
      solarDate,
      interpretation
    })

    wx.vibrateShort({ type: 'medium' })
  },

  // 根据签文生成解签
  getInterpretation(fortune: string): string {
    const interpretations: Record<string, string> = {
      '今日宜静心,诸事渐明': '此签示人:静能生慧,心定则神明。今日宜独处思考,避免浮躁。凡事不急不躁,自有水到渠成之时。',
      '顺其自然,水到渠成': '此签示人:不必强求,顺应天时。该来的总会来,该去的留不住。放下执念,随遇而安,反而能得偿所愿。',
      '内心笃定,万事可期': '此签示人:信念坚定,无所畏惧。只要方向正确,脚步坚定,前方必有光明。今日宜果断行动,莫要犹豫。',
      '今日宜思考,勿急于行动': '此签示人:谋定而后动。今日不宜仓促决定,宜多思多虑。待时机成熟,再做行动不迟。',
      '相信直觉,答案就在心中': '此签示人:内心自有明镜。别人的建议仅供参考,真正的答案早已在你心里。听从内心的声音,不会错。',
      '今日宜放下执念,海阔天空': '此签示人:放手即自由。有些事,越执着越痛苦。不如放下,给自己一片开阔天地。失去的,自有更好的在前方。',
      '大道至简,返璞归真': '此签示人:简单即是真理。复杂的往往不是答案,返璞归真,回归本心,方能看清事物本质。',
      '心有所向,日复一日': '此签示人:坚持的力量。只要方向不变,每一天的积累都在靠近目标。莫要急躁,静待花开。',
      '凡事皆有裂痕,那是光进来的地方': '此签示人:接纳不完美。痛苦和挫折,往往是成长的契机。那些裂痕,正是让光照进生命的地方。',
      '此刻即是答案,当下即是永恒': '此签示人:活在当下。不念过去,不畏将来。此时此刻,便是人生最好的状态。珍惜眼前,把握现在。'
    }

    return interpretations[fortune] || '此签示人:万事万物,皆有定数。顺应自然,静待时机,自有答案显现。'
  },

  // 返回
  onBackTap() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateBack()
  },

  // 分享
  onShareTap() {
    wx.vibrateShort({ type: 'medium' })
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: `${this.data.dailyFortune} | 心之解惑·每日一签`,
      path: '/pages/daily/daily'
    }
  }
})
