// pages/home/home.ts
Page({
  data: {
    statusBarHeight: 44,
    dailyFortune: '今日宜静心,诸事渐明',
    lunarDate: '农历十二月廿九',
    selectedCategory: '',
    isBreathing: true,
    categories: [
      { key: 'emotion', name: '情感', icon: '💕' },
      { key: 'career', name: '事业', icon: '💼' },
      { key: 'study', name: '学业', icon: '📚' },
      { key: 'wealth', name: '财富', icon: '💰' },
      { key: 'general', name: '通用', icon: '✨' }
    ]
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 44
    })

    // 生成每日一签
    this.generateDailyFortune()
  },

  // 生成每日一签
  generateDailyFortune() {
    const fortunes = [
      '今日宜静心,诸事渐明',
      '顺其自然,水到渠成',
      '内心笃定,万事可期',
      '今日宜思考,勿急于行动',
      '相信直觉,答案就在心中',
      '今日宜放下执念,海阔天空'
    ]
    
    // 根据日期生成随机索引
    const today = new Date()
    const seed = today.getFullYear() + today.getMonth() + today.getDate()
    const index = seed % fortunes.length
    
    // 生成农历日期(简化版)
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    
    this.setData({
      dailyFortune: fortunes[index],
      lunarDate: `农历${lunarMonths[today.getMonth()]}${lunarDays[today.getDate() - 1]}`
    })
  },

  // 点击每日一签卡片
  onDailyCardTap() {
    wx.vibrateShort({ type: 'light' })
    wx.showToast({
      title: '每日一签',
      icon: 'none',
      duration: 1500
    })
  },

  // 选择问题类型
  onCategoryTap(e: any) {
    const { key } = e.currentTarget.dataset
    wx.vibrateShort({ type: 'medium' })
    
    this.setData({
      selectedCategory: key
    })
  },

  // 长按开始
  onTouchStart() {
    if (!this.data.selectedCategory) {
      wx.vibrateShort({ type: 'heavy' })
      wx.showToast({
        title: '请先选择问题类型',
        icon: 'none'
      })
      return
    }

    // 停止呼吸动画
    this.setData({
      isBreathing: false
    })

    // 震动反馈
    wx.vibrateShort({ type: 'medium' })

    // 跳转到交互页
    wx.navigateTo({
      url: `/pages/seeking/seeking?category=${this.data.selectedCategory}`
    })
  },

  // 长按结束
  onTouchEnd() {
    // 恢复呼吸动画
    this.setData({
      isBreathing: true
    })
  },

  // 触摸取消
  onTouchCancel() {
    this.setData({
      isBreathing: true
    })
  },

  onShow() {
    // 页面显示时恢复呼吸动画
    this.setData({
      isBreathing: true
    })
  }
})
