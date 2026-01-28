// pages/seeking/seeking.ts
import { zenQuotes } from '../../utils/answers'

Page({
  data: {
    category: '',
    userThought: '', // 用户输入的心声
    visiblePages: [0, 1, 2, 3, 4],
    currentPage: 0,
    progress: 0,
    canRelease: false,
    currentZenQuote: '',
    quoteVisible: true,
    zenQuotes: zenQuotes
  },

  pageFlipTimer: null as any,
  vibrateTimer: null as any,
  progressTimer: null as any,
  quoteTimer: null as any,
  pressStartTime: 0,
  bgAudio: null as any,
  isPressed: false,

  onLoad(options: any) {
    this.setData({
      category: options.category || 'general',
      userThought: decodeURIComponent(options.thought || '')
    })
  },

  // 触摸开始 - 用户按住屏幕
  onTouchStart() {
    if (this.isPressed) return
    this.isPressed = true
    
    // 启动所有动画
    this.startAnimations()
  },

  // 触摸结束 - 用户松开手指
  onTouchEnd() {
    if (!this.isPressed) return
    this.isPressed = false

    // 生成结果
    this.generateResult()
  },

  // 触摸取消
  onTouchCancel() {
    if (!this.isPressed) return
    this.isPressed = false

    // 停止所有动画
    this.stopAllAnimations()

    // 返回上一页
    wx.navigateBack()
  },

  // 启动所有动画效果
  startAnimations() {
    this.pressStartTime = Date.now()

    // 1. 开始翻书动画
    this.startPageFlip()

    // 2. 开始持续震动
    this.startVibration()

    // 3. 开始进度条动画
    this.startProgress()

    // 4. 开始禅语切换
    this.startZenQuotes()

    // 5. 初始化粒子效果
    this.initParticles()

    // 6. 播放背景音效
    this.playBackgroundAudio()
  },

  // 书页翻动动画
  startPageFlip() {
    let flipCount = 0
    this.pageFlipTimer = setInterval(() => {
      const currentPage = flipCount % 5
      this.setData({
        currentPage
      })

      // 播放翻页音效(可选)
      // this.playPageSound()

      flipCount++
    }, 100)
  },

  // 持续震动
  startVibration() {
    wx.vibrateShort({ type: 'light' })
    this.vibrateTimer = setInterval(() => {
      wx.vibrateShort({ type: 'light' })
    }, 300)
  },

  // 进度条动画
  startProgress() {
    let progress = 0
    this.progressTimer = setInterval(() => {
      if (progress < 60) {
        progress += 2 // 快速增长
      } else if (progress < 85) {
        progress += 0.5 // 减速
      } else if (progress < 99) {
        progress += 0.1 // 极慢
      }

      this.setData({ progress })

      // 2秒后可以松开
      if (Date.now() - this.pressStartTime >= 2000 && !this.data.canRelease) {
        this.setData({ canRelease: true })
      }
    }, 100)
  },

  // 禅语切换
  startZenQuotes() {
    let quoteIndex = 0
    this.setData({
      currentZenQuote: this.data.zenQuotes[0]
    })

    this.quoteTimer = setInterval(() => {
      this.setData({ quoteVisible: false })

      setTimeout(() => {
        quoteIndex = (quoteIndex + 1) % this.data.zenQuotes.length
        this.setData({
          currentZenQuote: this.data.zenQuotes[quoteIndex],
          quoteVisible: true
        })
      }, 300)
    }, 3000)
  },

  // 初始化粒子效果
  initParticles() {
    // TODO: 使用Canvas 2D API绘制粒子
    // 由于小程序Canvas API复杂度较高,这里提供基础框架
    const query = wx.createSelectorQuery()
    query.select('#particleCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          // const canvas = res[0].node
          // const ctx = canvas.getContext('2d')
          // 绘制粒子逻辑...
        }
      })
  },

  // 播放背景音效
  playBackgroundAudio() {
    this.bgAudio = wx.createInnerAudioContext()
    // this.bgAudio.src = '/assets/audio/water-bg.mp3'
    // this.bgAudio.loop = true
    // this.bgAudio.volume = 0

    // 渐进增大音量
    // let volume = 0
    // const volumeTimer = setInterval(() => {
    //   if (volume < 0.5) {
    //     volume += 0.05
    //     this.bgAudio.volume = volume
    //   } else {
    //     clearInterval(volumeTimer)
    //   }
    // }, 100)

    // this.bgAudio.play()
  },

  // 停止所有动画
  stopAllAnimations() {
    if (this.pageFlipTimer) clearInterval(this.pageFlipTimer)
    if (this.vibrateTimer) clearInterval(this.vibrateTimer)
    if (this.progressTimer) clearInterval(this.progressTimer)
    if (this.quoteTimer) clearInterval(this.quoteTimer)
    if (this.bgAudio) {
      this.bgAudio.stop()
      this.bgAudio.destroy()
    }
  },

  // 生成结果
  generateResult() {
    const pressDuration = Date.now() - this.pressStartTime

    if (pressDuration < 2000) {
      wx.vibrateShort({ type: 'heavy' })
      wx.showToast({
        title: '请默念一遍你的心声',
        icon: 'none'
      })
      return
    }

    // 停止所有动画
    this.stopAllAnimations()

    // 进度条填满
    this.setData({ progress: 100 })

    // 重震反馈
    wx.vibrateShort({ type: 'heavy' })

    // 播放揭晓音效
    // const revealAudio = wx.createInnerAudioContext()
    // revealAudio.src = '/assets/audio/reveal.mp3'
    // revealAudio.play()

    // 屏幕闪白效果
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/result/result?category=${this.data.category}&thought=${encodeURIComponent(this.data.userThought)}`
      })
    }, 300)
  },

  onUnload() {
    this.stopAllAnimations()
  },

  onHide() {
    // 页面隐藏时停止动画
    this.stopAllAnimations()
    
    // 提示用户
    wx.showModal({
      title: '提示',
      content: '已中断,是否重新开始?',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
