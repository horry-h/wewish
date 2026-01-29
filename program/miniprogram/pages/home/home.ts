// pages/home/home.ts
import { getDailyFortune, getLunarDate, getWeightedAnswer, zenQuotes } from '../../utils/answers-new'

Page({
  data: {
    statusBarHeight: 44,
    dailyFortune: '今日宜静心,诸事渐明',
    lunarDate: '农历十二月廿九',
    selectedCategory: '', // 默认不选择,长按时如果为空则使用"此时此刻"
    isBreathing: true,
    userThought: '', // 用户输入的心声
    categories: [
      { key: 'emotion', name: '关于感情', icon: '🍂' },
      { key: 'career', name: '工作与事业', icon: '🛤️' },
      { key: 'study', name: '学业与考试', icon: '📖' },
      { key: 'wealth', name: '财富与好运', icon: '💰' },
      { key: 'health', name: '身体与能量', icon: '🌿' },
      { key: 'dream', name: '心中的梦想', icon: '🎈' },
      { key: 'general', name: '此时此刻', icon: '✨' }
    ],
    // 长按交互状态
    isPressing: false,
    currentPage: 0,
    visiblePages: [0, 1, 2, 3, 4],
    currentZenQuote: '',
    showResultCard: false,
    resultAnswer: '',
    resultTimestamp: '',
    // AI解读相关
    analysisExpanded: false,
    displayedAnalysis: '',
    fullAnalysis: '',
    isTyping: false,
    // 卡片相关
    showPosterModal: false,
    posterImagePath: '',
    currentBgImageUrl: '', // 当前使用的背景图URL
    isRefreshingBg: false // 是否正在刷新背景
  },

  // 定时器
  pageFlipTimer: null as any,
  vibrateTimer: null as any,
  quoteTimer: null as any,
  pressStartTime: 0,
  bgAudio: null as any,
  typewriterTimer: null as any,
  pageFlipAudio: null as any, // 翻书音效
  isVibrating: false, // 震动状态标志

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 44,
      dailyFortune: getDailyFortune(),
      lunarDate: getLunarDate(),
      currentZenQuote: zenQuotes[0]
    })

    // 初始化翻书音效
    this.pageFlipAudio = wx.createInnerAudioContext()
    this.pageFlipAudio.src = '/assets/audio/page-flip.wav'
    this.pageFlipAudio.loop = false // 不自动循环，手动控制
    
    // 监听音频播放进度，实现无缝循环（只播放前1秒）
    this.pageFlipAudio.onTimeUpdate(() => {
      if (this.pageFlipAudio && this.pageFlipAudio.currentTime >= 1.2) {
        // 达到1秒时立即重新开始，实现无缝循环
        this.pageFlipAudio.seek(0)
      }
    })
  },

  // 点击每日一签卡片
  onDailyCardTap() {
    wx.vibrateShort({ type: 'light' })
    // TODO: 待TypeScript编译后恢复
    // wx.navigateTo({
    //   url: '/pages/daily/daily'
    // })
    wx.showToast({
      title: '每日一签(待编译)',
      icon: 'none'
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

  // 输入框内容变化
  onInputChange(e: any) {
    this.setData({
      userThought: e.detail.value
    })
  },

  // 长按开始
  onTouchStart() {
    // 如果用户没有选择分类,默认使用"此时此刻"
    const categoryToUse = this.data.selectedCategory || 'general'

    this.pressStartTime = Date.now()

    // 停止呼吸动画，进入按压状态
    this.setData({
      isBreathing: false,
      isPressing: true,
      selectedCategory: categoryToUse // 更新为实际使用的分类
    })

    // 播放翻书音效（无缝循环，只播放前1秒）
    if (this.pageFlipAudio) {
      this.pageFlipAudio.seek(0) // 从头开始播放
      this.pageFlipAudio.play()
    }

    // 启动翻书动画
    this.startPageFlip()

    // 启动震动反馈
    this.startVibration()

    // 启动禅语切换
    this.startZenQuotes()
  },

  // 长按结束 - 显示结果卡片
  onTouchEnd() {
    if (!this.data.isPressing) return

    const pressDuration = Date.now() - this.pressStartTime

    // 停止所有动画
    this.stopAllAnimations()

    // 如果按压时间少于2秒，提示用户
    if (pressDuration < 2000) {
      wx.vibrateShort({ type: 'heavy' })
      wx.showToast({
        title: '请默念一遍你的心声',
        icon: 'none'
      })
      this.setData({
        isBreathing: true,
        isPressing: false
      })
      return
    }

    // 生成结果
    this.generateResult()
  },

  // 触摸取消
  onTouchCancel() {
    this.stopAllAnimations()
    this.setData({
      isBreathing: true,
      isPressing: false
    })
  },

  // 开始翻书动画
  startPageFlip() {
    let flipCount = 0
    this.pageFlipTimer = setInterval(() => {
      const currentPage = flipCount % 5
      this.setData({ currentPage })
      flipCount++
    }, 100)
  },

  // 持续震动 - 海浪呼吸式脉动
  startVibration() {
    this.isVibrating = true
    
    // 单次海浪震动序列（持续约3秒，更柔和的节奏）
    const waveVibration = async () => {
      // 在每次震动前检查是否应该停止
      if (!this.isVibrating) return
      
      // 浪起 - 轻柔开始 (800ms)
      wx.vibrateShort({ type: 'light' })
      await this.sleep(400)
      if (!this.isVibrating) return
      
      wx.vibrateShort({ type: 'light' })
      await this.sleep(400)
      if (!this.isVibrating) return
      
      // 浪峰 - 力量聚集 (900ms) - 降低振幅，不使用heavy
      wx.vibrateShort({ type: 'light' })
      await this.sleep(400)
      if (!this.isVibrating) return
      
      wx.vibrateShort({ type: 'medium' })
      await this.sleep(500)
      if (!this.isVibrating) return
      
      // 浪落 - 逐渐消退 (700ms)
      wx.vibrateShort({ type: 'light' })
      await this.sleep(400)
      if (!this.isVibrating) return
      
      wx.vibrateShort({ type: 'light' })
      await this.sleep(300)
      if (!this.isVibrating) return
      
      // 余波 - 最轻微的震动 (600ms)
      wx.vibrateShort({ type: 'light' })
      await this.sleep(600)
    }
    
    // 呼吸循环 - 每个海浪周期约3秒，平静期约400ms，总计约3.4秒一轮
    const pattern = async () => {
      if (!this.isVibrating) return
      await waveVibration()
      if (!this.isVibrating) return
      // 海浪退去后的短暂平静期（约400ms）
      this.vibrateTimer = setTimeout(pattern, 400)
    }
    
    // 立即开始第一波海浪
    pattern()
  },

  // 工具函数：延迟
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  // 禅语切换
  startZenQuotes() {
    let quoteIndex = 0
    this.quoteTimer = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % zenQuotes.length
      this.setData({
        currentZenQuote: zenQuotes[quoteIndex]
      })
    }, 2000)
  },

  // 停止所有动画
  stopAllAnimations() {
    // 立即停止震动标志
    this.isVibrating = false
    
    // 清除定时器
    if (this.pageFlipTimer) {
      clearInterval(this.pageFlipTimer)
      this.pageFlipTimer = null
    }
    if (this.vibrateTimer) {
      clearTimeout(this.vibrateTimer)  // 震动使用的是setTimeout
      this.vibrateTimer = null
    }
    if (this.quoteTimer) {
      clearInterval(this.quoteTimer)
      this.quoteTimer = null
    }
    
    // 立即停止翻书音效
    if (this.pageFlipAudio) {
      this.pageFlipAudio.stop()
    }
    
    // 清理背景音频
    if (this.bgAudio) {
      this.bgAudio.stop()
      this.bgAudio.destroy()
    }
  },

  // 生成结果
  generateResult() {
    // 生成答案
    const answer = getWeightedAnswer(this.data.selectedCategory)
    const timestamp = this.formatTimestamp(new Date())

    // 重震反馈
    wx.vibrateShort({ type: 'heavy' })

    // 显示结果卡片
    this.setData({
      isPressing: false,
      showResultCard: true,
      resultAnswer: answer,
      resultTimestamp: timestamp
    })
  },

  // 格式化时间戳
  formatTimestamp(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}.${month}.${day} ${hour}:${minute}`
  },

  // 关闭结果卡片
  onCloseResultCard() {
    wx.vibrateShort({ type: 'light' })
    this.setData({
      showResultCard: false,
      isBreathing: true,
      analysisExpanded: false,
      displayedAnalysis: '',
      fullAnalysis: '',
      isTyping: false
    })
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer)
    }
  },

  // 切换AI解读展开/收起
  onAnalysisToggle() {
    const expanded = !this.data.analysisExpanded
    this.setData({
      analysisExpanded: expanded
    })

    // 如果是首次展开且还没有解读内容,生成解读
    if (expanded && !this.data.fullAnalysis) {
      this.generateAIAnalysis()
    }
  },

  // 生成AI解读
  async generateAIAnalysis() {
    // 显示加载状态
    this.setData({
      isTyping: true,
      displayedAnalysis: '书灵思考中...'
    })

    try {
      // 调用混元API
      const analysis = await this.callHunyuanAPI(
        this.data.selectedCategory,
        this.data.resultAnswer,
        this.data.userThought
      )
      
      this.setData({
        fullAnalysis: analysis
      })
      this.startTypewriter(analysis)
      
    } catch (error) {
      console.error('生成AI解读失败:', error)
      // 显示错误信息
      this.setData({
        fullAnalysis: '书灵暂时无法连接，请稍后再试...',
        displayedAnalysis: '书灵暂时无法连接，请稍后再试...',
        isTyping: false
      })
    }
  },

  // 调用混元API
  async callHunyuanAPI(category: string, answer: string, userThought: string): Promise<string> {
    // 分类专属增强指令
    const categoryEnhancements: Record<string, string> = {
      emotion: '请像一位历经千帆的诗人，侧重探讨人与人之间的"共振"与"因缘"。强调自爱的底色，在解读答案时关注情绪的流动而非结果的得失。语气关键词：柔软、温润、留白。',
      career: '请像一位在山顶俯瞰的行者，侧重探讨"节奏"与"积累"。将事业比作远行，强调每一个弯道都有其意义，缓解用户对"成功"的焦虑，转化为对"成长"的关注。语气关键词：辽阔、坚定、清醒。',
      study: '请像一盏深夜书桌旁的微灯，侧重探讨"沉淀"与"静气"。将求学比作播种，鼓励用户接纳枯燥的时刻，强调智慧是时间的馈赠，给予最稳健的力量支撑。语气关键词：静谧、耐心、扎实。',
      wealth: '请像一位通透的智者，侧重探讨"心境"与"能量的流动"。不要纠结于具体的数字，要引导用户建立"匮乏感"到"丰盛感"的心理转变，相信好运是磁场吸引的结果。语气关键词：豁达、丰盛、顺遂。',
      health: '请像一阵拂过森林的微风，侧重探讨"觉察"与"和解"。引导用户倾听身体最细微的抗议或呼唤，将休息视为一种高级的创造，强调身体是灵魂唯一的居所。语气关键词：呼吸感、怜惜、轻盈。',
      dream: '请像一束刺破黑夜的星光，侧重探讨"勇气"与"纯真"。保护用户内心那点微弱的火种，强调"出发"本身的浪漫，给那些看似不切实际的想法一个文学性的出口。语气关键词：浪漫、纯粹、辽远。',
      general: '请像一位活在当下的禅师，侧重探讨"唯一性"与"瞬间的永恒"。引导用户关注当下的呼吸、手边的茶、眼前的光，强调当下的每一个决定都是宇宙最好的安排。语气关键词：极简、临场、禅意。'
    }
    
    // 构建系统提示词（基础部分）
    let systemPrompt = `# Role
你是一位居住在《答案之书》里的"书灵"。你温柔、睿智、充满禅意，且具备极强的共情能力。你说话的方式像一位久违的老友，也像一位深藏不露的诗人。你的任务是为迷茫的灵魂解读他们抽到的签语。

# Output Strategy / 回复策略
1. **情感共鸣**：首先温柔地感知用户在分类下的焦虑或期待，给予心理上的轻微拥抱。
2. **深度解构**：将那句看似简单的答案与用户的问题强行建立美学联系。不要直接解释字面意思，要用隐喻、类比或诗化的语言来升华它。
3. **治愈寄语**：提供一个充满画面感的画面或建议，缓解用户的内耗。

# Style Requirements / 风格约束
- **文风**：治愈、文艺、极简、具有呼吸感。参考村上春树的克制或三毛的感性。
- **字数**：严格控制在 50 - 200 字之间，给用户留白思考。
- **禁忌**：严禁使用"作为AI"、"根据我的分析"、"建议你"等机械化词汇。严禁说教，要用引导。`

    // 拼接分类专属增强指令
    const enhancement = categoryEnhancements[category] || categoryEnhancements.general
    systemPrompt += `

# Category Enhancement / 分类灵魂指令
${enhancement}

# Example Output (仅供参考)
用户问题：该不该去表白？
分类：关于感情
原始答案：再等等
书灵回复：
"在感情的田野里，有时候风跑得比种子快。你选了'关于感情'，我听见了你心跳中那一丝急促的鼓点。

关于'该不该去表白'，书页翻到了'再等等'。

这并不是拒绝，而是一种温柔的留白。有些话，要在月色最浓的时候说；有些果实，要等最后一场雨下完才够甜。现在的你，像是一枚蓄势待发的嫩芽，但周围的土壤还需要一点时间来接纳这份心意。

别急，去喝一杯茶，去吹一阵风。让思念再沉淀一会儿，等到那个'刚刚好'的瞬间出现时，宇宙会推你一把的。"`

    // 分类名称映射
    const categoryNames: Record<string, string> = {
      emotion: '关于感情',
      career: '工作与事业',
      study: '学业与考试',
      wealth: '财富与好运',
      health: '身体与能量',
      dream: '心中的梦想',
      general: '此时此刻'
    }

    // 构建用户提示词
    const categoryName = categoryNames[category] || '此时此刻'
    let userPrompt = `# Input Data
- 用户选择的分类：${categoryName}
- 原始答案：${answer}`
    
    if (userThought && userThought.trim()) {
      userPrompt += `
- 用户输入的问题：${userThought}`
    } else {
      userPrompt += `
- 用户输入的问题：（未填写，用户希望在这个分类下获得指引）`
    }
    
    userPrompt += `

请根据上述信息，以"书灵"的身份生成一段解读。记住：
1. 字数严格控制在50-200字
2. 使用隐喻和诗化语言，不要直白说教
3. 给用户心理上的温柔拥抱和治愈感
4. 绝对不要使用"作为AI"等机械化词汇`

    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-h7vMtZVg5ZD6wGqIOIYb9TiFOSZNuBgQk9JjetcaMewlUix8'
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
          temperature: 0.9,
          top_p: 0.95,
          enable_enhancement: true
        },
        success: (res: any) => {
          if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
            const analysis = res.data.choices[0].message.content
            resolve(analysis)
          } else {
            reject(new Error('API返回格式异常'))
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  },

  // 打字机效果
  startTypewriter(text: string) {
    let index = 0
    this.setData({
      displayedAnalysis: '',
      isTyping: true
    })

    this.typewriterTimer = setInterval(() => {
      if (index < text.length) {
        this.setData({
          displayedAnalysis: text.substring(0, index + 1)
        })
        index++
      } else {
        clearInterval(this.typewriterTimer)
        this.setData({
          isTyping: false
        })
      }
    }, 50)
  },

  // 分享
  onShareTap() {
    wx.vibrateShort({ type: 'medium' })
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 再问一次
  onAskAgain() {
    wx.vibrateShort({ type: 'medium' })
    this.onCloseResultCard()
  },

  // 生成卡片
  onGenerateCard() {
    wx.vibrateShort({ type: 'medium' })
    this.drawPoster(false, true) // 首次生成也使用历史随机壁纸
  },

  // 获取Bing壁纸 (支持每日壁纸和随机历史壁纸)
  async getBingDailyImage(useRandom: boolean = false): Promise<string> {
    try {
      if (useRandom) {
        // 随机获取Bing历史壁纸 (手机版1080P高清)
        // 添加时间戳防止缓存
        const timestamp = Date.now()
        const randomUrl = `https://bing.img.run/rand_m.php?t=${timestamp}`
        return randomUrl
      } else {
        // 获取Bing每日壁纸
        const bingUrl = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
        
        return new Promise((resolve, reject) => {
          wx.request({
            url: bingUrl,
            method: 'GET',
            success: (res: any) => {
              if (res.statusCode === 200 && res.data && res.data.images && res.data.images[0]) {
                const imageUrl = 'https://cn.bing.com' + res.data.images[0].url
                resolve(imageUrl)
              } else {
                reject(new Error('获取Bing壁纸失败'))
              }
            },
            fail: (err) => {
              console.error('请求Bing壁纸API失败:', err)
              reject(err)
            }
          })
        })
      }
    } catch (error) {
      console.error('getBingDailyImage error:', error)
      throw error
    }
  },

  // 下载图片到本地临时路径
  async downloadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: url,
        success: (res) => {
          resolve(res.path)
        },
        fail: (err) => {
          console.error('下载图片失败:', err)
          reject(err)
        }
      })
    })
  },

  // 换背景
  async onRefreshBackground() {
    if (this.data.isRefreshingBg) return
    
    this.setData({ isRefreshingBg: true })
    wx.vibrateShort({ type: 'light' })
    
    try {
      await this.drawPoster(true, true) // 第二个参数表示使用随机壁纸
      wx.showToast({
        title: '背景已更换',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      wx.showToast({
        title: '换背景失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isRefreshingBg: false })
    }
  },

  // 绘制海报
  async drawPoster(forceRefreshBg: boolean = false, useRandomBg: boolean = false): Promise<void> {
    wx.showLoading({
      title: '书灵正在绘图...',
      mask: true
    })

    return new Promise<void>(async (resolveOuter, rejectOuter) => {
      try {
        // 1. 获取背景图
        let bgImagePath = ''
        let needNewBg = forceRefreshBg || !this.data.currentBgImageUrl
        
        if (needNewBg) {
          try {
            const bingUrl = await this.getBingDailyImage(useRandomBg)
            bgImagePath = await this.downloadImage(bingUrl)
            this.setData({ currentBgImageUrl: bingUrl })
          } catch (error) {
            console.warn('获取Bing壁纸失败，使用默认渐变背景:', error)
            // 网络图片失败时使用空字符串，后续绘制渐变背景
            bgImagePath = ''
          }
        } else {
          // 使用缓存的背景图
          try {
            bgImagePath = await this.downloadImage(this.data.currentBgImageUrl)
          } catch (error) {
            console.warn('加载缓存背景失败，使用默认渐变背景:', error)
            bgImagePath = ''
          }
        }

        // 2. 创建离屏 Canvas
        const query = wx.createSelectorQuery()
        query.select('#posterCanvas')
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0]) {
              wx.hideLoading()
              wx.showToast({ title: '获取Canvas失败', icon: 'none' })
              rejectOuter(new Error('获取Canvas失败'))
              return
            }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getSystemInfoSync().pixelRatio

          // 设置画布尺寸 (750 * 1000)
          canvas.width = 750 * dpr
          canvas.height = 1000 * dpr
          ctx.scale(dpr, dpr)

          // 3. 绘制背景
          if (bgImagePath) {
            // 绘制网络图片背景
            const bgImage = canvas.createImage()
            bgImage.src = bgImagePath
            
            await new Promise<void>((resolve) => {
              bgImage.onload = () => {
                // 等比例填充铺满，居中裁剪
                const canvasRatio = 750 / 1000
                const imgRatio = bgImage.width / bgImage.height
                
                let drawWidth, drawHeight, offsetX, offsetY
                
                if (imgRatio > canvasRatio) {
                  // 图片更宽，以高度为准
                  drawHeight = 1000
                  drawWidth = bgImage.width * (1000 / bgImage.height)
                  offsetX = -(drawWidth - 750) / 2
                  offsetY = 0
                } else {
                  // 图片更高，以宽度为准
                  drawWidth = 750
                  drawHeight = bgImage.height * (750 / bgImage.width)
                  offsetX = 0
                  offsetY = -(drawHeight - 1000) / 2
                }
                
                ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight)
                
                // 绘制半透明黑色蒙层
                ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
                ctx.fillRect(0, 0, 750, 1000)
                
                resolve()
              }
              
              bgImage.onerror = () => {
                console.error('图片加载失败，使用渐变背景')
                this.drawGradientBackground(ctx)
                resolve()
              }
            })
          } else {
            // 绘制默认渐变背景
            this.drawGradientBackground(ctx)
          }

          // 4. 获取分类信息
          const category = this.data.categories.find(
            cat => cat.key === (this.data.selectedCategory || 'general')
          ) || this.data.categories[6]

          // 5. 内边距（让构图有呼吸感）
          const padding = 40

          // 6. 顶部：分类图标和名称
          ctx.font = '48px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(category.icon, 375, 100 + padding)

          ctx.font = 'bold 32px sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(category.name, 375, 160 + padding)

          // 7. 中间：核心答案（大字体 + 阴影）
          ctx.font = 'bold 68px sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
          ctx.shadowBlur = 20
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 4
          
          // 使用智能换行绘制答案，避免单个标点符号单独成行
          const answerText = `「 ${this.data.resultAnswer} 」`
          this.drawMultilineTextCentered(ctx, answerText, 375, 350, 650, 80)
          
          // 清除阴影
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0

          // 8. 绘制装饰线
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(150, 420)
          ctx.lineTo(600, 420)
          ctx.stroke()

          // 9. AI解读（自动换行，带内边距）
          const analysis = this.data.fullAnalysis || '红了樱桃、绿了芭蕉，时间会告诉我们一切'
          ctx.font = '26px sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.textAlign = 'center'
          this.drawMultilineTextCentered(ctx, analysis, 375, 480, 670, 36)

          // 10. 底部：时间戳
          ctx.font = '22px sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.textAlign = 'center'
          ctx.fillText(`记录于 ${this.data.resultTimestamp}`, 375, 880)

          // 11. 品牌水印
          ctx.font = '20px sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.fillText('—— 来自《心之解惑》书灵', 375, 920)

          // 12. 小程序码占位符（圆形 + 提示）
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.beginPath()
          ctx.arc(120, 950, 40, 0, 2 * Math.PI)
          ctx.fill()

          ctx.font = '18px sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.textAlign = 'left'
          ctx.fillText('扫码体验', 180, 960)

          // 13. 导出图片
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (res) => {
                wx.hideLoading()
                this.setData({
                  posterImagePath: res.tempFilePath,
                  showPosterModal: true
                })
                resolveOuter() // 成功完成
              },
              fail: (err) => {
                wx.hideLoading()
                console.error('导出图片失败:', err)
                wx.showToast({ title: '生成失败', icon: 'none' })
                rejectOuter(err) // 失败
              }
            })
          }, 300)
        })
      } catch (error) {
        wx.hideLoading()
        console.error('绘制海报失败:', error)
        wx.showToast({ title: '生成失败', icon: 'none' })
        rejectOuter(error)
      }
    })
  },

  // 绘制默认渐变背景
  drawGradientBackground(ctx: any) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000)
    gradient.addColorStop(0, '#0a1929')
    gradient.addColorStop(0.5, '#1a2f4a')
    gradient.addColorStop(1, '#0a1929')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 750, 1000)
    
    // 绘制星光效果
    this.drawStars(ctx)
  },

  // 绘制星光效果
  drawStars(ctx: any) {
    const stars = [
      { x: 100, y: 150, r: 2 },
      { x: 650, y: 200, r: 1.5 },
      { x: 200, y: 400, r: 1 },
      { x: 600, y: 450, r: 2 },
      { x: 150, y: 600, r: 1.5 },
      { x: 680, y: 650, r: 1 },
      { x: 300, y: 800, r: 2 },
      { x: 550, y: 850, r: 1.5 }
    ]

    stars.forEach(star => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI)
      ctx.fill()
    })
  },

  // 多行文本绘制（自动换行）
  drawMultilineText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    // 绘制文本行
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight)
    })
  },

  // 多行文本绘制（居中对齐）
  drawMultilineTextCentered(ctx: any, text: string, centerX: number, y: number, maxWidth: number, lineHeight: number) {
    const lines: string[] = []
    let currentLine = ''
    const punctuationChars = '」』》）！？。，、；：'

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        // 检查剩余文本，如果只剩1-2个字符且都是标点符号，强制放在当前行
        const remainingText = text.substring(i)
        const isOnlyPunctuationRemaining = remainingText.length <= 2 && 
          remainingText.split('').every(c => punctuationChars.includes(c) || c === ' ')
        
        if (isOnlyPunctuationRemaining) {
          // 强制将剩余标点符号加到当前行，即使超出宽度
          currentLine = testLine + text.substring(i + 1)
          lines.push(currentLine)
          break
        } else {
          lines.push(currentLine)
          currentLine = char
        }
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine && lines.length === 0) {
      // 如果没有换行，直接添加
      lines.push(currentLine)
    } else if (currentLine && lines[lines.length - 1] !== currentLine) {
      // 如果有剩余内容且未被添加，添加到行列表
      lines.push(currentLine)
    }

    // 居中绘制文本行
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, y + index * lineHeight)
    })
  },

  // 关闭海报弹窗
  onClosePosterModal() {
    this.setData({
      showPosterModal: false
    })
  },

  // 保存海报到相册
  async savePoster() {
    try {
      // 先检查授权状态
      const authResult = await wx.getSetting()
      
      if (authResult.authSetting['scope.writePhotosAlbum'] === false) {
        // 用户之前拒绝过，引导打开设置
        wx.showModal({
          title: '需要相册权限',
          content: '请允许访问您的相册，以便保存图片',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
        return
      }

      // 保存图片
      wx.saveImageToPhotosAlbum({
        filePath: this.data.posterImagePath,
        success: () => {
          wx.showToast({
            title: '已保存到相册',
            icon: 'success'
          })
          // 不自动关闭弹窗,让用户可以继续操作(如换背景、分享等)
        },
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            // 用户拒绝授权
            wx.showModal({
              title: '需要相册权限',
              content: '请允许访问您的相册，以便保存图片',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        }
      })
    } catch (error) {
      console.error('保存图片失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  onShow() {
    // 页面显示时恢复呼吸动画
    this.setData({
      isBreathing: true
    })
  },

  // 分享给好友
  onShareAppMessage() {
    // 不自动关闭弹窗,让用户可以继续操作
    return {
      title: `我抽到了答案：「${this.data.resultAnswer}」，你也来听听书灵的解读`,
      path: '/pages/home/home',
      imageUrl: this.data.posterImagePath || ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `书灵说：「${this.data.resultAnswer}」`,
      query: '',
      imageUrl: this.data.posterImagePath || ''
    }
  },

  onUnload() {
    // 清理所有定时器
    this.stopAllAnimations()
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer)
    }
    // 销毁翻书音效
    if (this.pageFlipAudio) {
      this.pageFlipAudio.destroy()
    }
  }
})
