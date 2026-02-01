// pages/fortune/fortune.ts

interface FortuneData {
  level: string // 运势等级: great, good, medium, fair, guard
  levelText: string // 运势文本: 大吉、中吉、小吉、平、守
  verse: string // 今日签语
  suitable: string // 今日宜
  unsuitable: string // 今日忌
  message: string // 书灵寄语
}

Page({
  data: {
    statusBarHeight: 44,
    todayDate: '',
    hintText: '心诚则灵，感受当下',
    isInteracting: false, // 是否正在交互（摇动或按压）
    isGenerating: false,
    stickState: 'hidden', // hidden | dropping | dropped
    showResult: false,
    fortuneData: null as FortuneData | null,
    verseLines: [] as string[], // 签语数组（分行后的结果）- 保留用于Canvas绘制
    verseLine1: '', // 第一列签文（第1、2句）
    verseLine2: '', // 第二列签文（第3、4句）
    displayedMessage: '',
    isDataReady: false, // AI数据是否已就绪
    hasClosedResult: false, // 标记用户是否主动关闭过签文
    backgroundImage: '', // Bing随机背景图
    showDebug: false, // 显示调试信息
  },

  // 定时器
  typewriterTimer: null as any,
  accelerometerStarted: false,
  
  // 音效相关
  shakeAudio: null as any,
  isPlayingShakeSound: false,
  
  // 触觉反馈定时器（200ms节奏）
  hapticTimer: null as any,
  
  // 交互检测
  isTouching: false, // 是否正在按压屏幕
  lastAccelTime: 0, // 上次检测到加速度的时间
  accelThreshold: 0.2, // 极低的微动阈值
  interactionCheckInterval: 100, // 交互状态检测间隔
  interactionCheckTimer: null as any,

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 44,
      todayDate: this.formatDate(new Date())
    })

    // 检查今日是否已抽签
    this.checkTodayFortune()

    // 初始化摇签音效
    this.initShakeAudio()

    // 启动加速度计监听（UI级别频率）
    this.startAccelerometer()
    
    // 启动交互状态监听
    this.startInteractionCheck()
    
    // 【关键】预加载AI内容（用户无感知）
    this.preloadFortuneData()
  },

  // 格式化日期
  formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },

  // 获取今日日期标识（YYYY-MM-DD）- 使用本地时间
  getTodayDateKey(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    console.log('📅 当前日期标识:', dateKey)
    return dateKey
  },

  // 获取当前季节
  getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return '春日'
    if (month >= 6 && month <= 8) return '夏日'
    if (month >= 9 && month <= 11) return '秋日'
    return '冬日'
  },

  // 检查今日是否已抽签
  checkTodayFortune() {
    try {
      const todayKey = this.getTodayDateKey()
      const savedFortuneData = wx.getStorageSync('fortune_data')

      console.log('🔍 检查今日签文:', {
        todayKey,
        savedDate: savedFortuneData?.date,
        hasData: !!savedFortuneData
      })

      if (savedFortuneData && savedFortuneData.date === todayKey) {
        // 今天已经抽过签了，显示提示但不自动弹出
        console.log('✅ 今日已抽签，加载本地签文')
        const { verseLines, verseLine1, verseLine2 } = this.processVerseForDisplay(savedFortuneData.fortune.verse)
        this.setData({
          fortuneData: savedFortuneData.fortune,
          verseLines: verseLines,
          verseLine1: verseLine1,
          verseLine2: verseLine2,
          hintText: '今日缘分已定，点击查看您的签文',
          hasClosedResult: true, // 标记为已关闭状态，避免自动弹出
          isDataReady: true // 标记数据已就绪
        })
        
        // 预加载背景图（如果已有则复用）
        if (savedFortuneData.backgroundImage) {
          this.setData({ backgroundImage: savedFortuneData.backgroundImage })
        } else {
          this.preloadBackgroundImage()
        }
        
        console.log('📋 已加载今日签文:', savedFortuneData.fortune.levelText)
      } else {
        // 不是今天的签文，清理旧数据
        if (savedFortuneData) {
          console.log('🗑️ 检测到旧签文 (日期: ' + savedFortuneData.date + ')，已清理')
          wx.removeStorageSync('fortune_data')
        }
        console.log('🆕 今日尚未抽签，准备预加载新签文')
      }
    } catch (error) {
      console.error('❌ 读取本地签文失败:', error)
    }
  },

  // 保存今日签文到本地（携带时间戳）
  saveTodayFortune(fortuneData: FortuneData) {
    try {
      const todayKey = this.getTodayDateKey()
      const saveData = {
        date: todayKey, // 日期标识 YYYY-MM-DD
        timestamp: Date.now(), // 时间戳
        fortune: fortuneData, // 签文数据
        backgroundImage: this.data.backgroundImage // 保存背景图路径
      }
      wx.setStorageSync('fortune_data', saveData)
      console.log('💾 今日签文已保存:', {
        date: todayKey,
        level: fortuneData.levelText,
        verse: fortuneData.verse.substring(0, 20) + '...'
      })
    } catch (error) {
      console.error('❌ 保存签文失败:', error)
    }
  },

  // 初始化摇签音效
  initShakeAudio() {
    try {
      // 创建音频实例
      this.shakeAudio = wx.createInnerAudioContext()
      
      // 使用木签摇动音效
      this.shakeAudio.src = '/assets/audio/mu-shake.mp3'
      this.shakeAudio.loop = true // 循环播放
      this.shakeAudio.volume = 0.7
      this.shakeAudio.obeyMuteSwitch = false
      this.shakeAudio.autoplay = false
      
      // 监听播放事件
      this.shakeAudio.onPlay(() => {
        this.isPlayingShakeSound = true
        // 启动触觉反馈节奏（每200ms）
        this.startHapticFeedback()
      })
      
      // 监听停止事件
      this.shakeAudio.onStop(() => {
        this.isPlayingShakeSound = false
        // 停止触觉反馈
        this.stopHapticFeedback()
      })
      
      // 监听暂停事件
      this.shakeAudio.onPause(() => {
        this.isPlayingShakeSound = false
        this.stopHapticFeedback()
      })
      
      // 监听错误
      this.shakeAudio.onError((err: any) => {
        console.error('音效播放错误:', err)
        this.isPlayingShakeSound = false
      })
      
      console.log('摇签音效初始化成功')
    } catch (error) {
      console.error('音效初始化失败:', error)
    }
  },

  // 播放摇签音效
  playShakeSound() {
    if (!this.shakeAudio || this.isPlayingShakeSound) return
    
    try {
      this.shakeAudio.seek(0) // 从头开始播放
      this.shakeAudio.play()
    } catch (error) {
      console.error('播放音效失败:', error)
    }
  },

  // 停止摇签音效
  stopShakeSound() {
    if (this.shakeAudio && this.isPlayingShakeSound) {
      try {
        this.shakeAudio.pause() // 使用pause并重置
        this.shakeAudio.seek(0)
        this.isPlayingShakeSound = false
      } catch (error) {
        console.error('停止音效失败:', error)
      }
    }
  },
  
  // 启动触觉反馈节奏（每200ms轻震动）
  startHapticFeedback() {
    if (this.hapticTimer) return
    
    this.hapticTimer = setInterval(() => {
      if (this.data.isInteracting && !this.data.showResult) {
        wx.vibrateShort({ type: 'light' })
      }
    }, 200)
  },
  
  // 停止触觉反馈
  stopHapticFeedback() {
    if (this.hapticTimer) {
      clearInterval(this.hapticTimer)
      this.hapticTimer = null
    }
  },

  // 启动加速度计
  startAccelerometer() {
    if (this.accelerometerStarted) return

    wx.startAccelerometer({
      interval: 'ui', // UI级别频率（60Hz）
      success: () => {
        console.log('加速度计启动成功')
        this.accelerometerStarted = true
        
        wx.onAccelerometerChange((res) => {
          this.handleAccelerometerChange(res)
        })
      },
      fail: (err) => {
        console.error('加速度计启动失败:', err)
        wx.showToast({
          title: '请允许使用传感器',
          icon: 'none'
        })
      }
    })
  },

  // 处理加速度变化（微动感应）
  handleAccelerometerChange(res: WechatMiniprogram.OnAccelerometerChangeCallbackResult) {
    // 如果已显示结果或已关闭过签文,忽略
    if (this.data.showResult || this.data.hasClosedResult) return

    const { x, y, z } = res
    
    // 计算加速度变化量
    const accelChange = Math.abs(x) + Math.abs(y) + Math.abs(z - 1)
    
    // 极低阈值，检测微动
    if (accelChange > this.accelThreshold) {
      this.lastAccelTime = Date.now()
    }
  },
  
  // 启动交互状态监听
  startInteractionCheck() {
    this.interactionCheckTimer = setInterval(() => {
      this.checkInteractionState()
    }, this.interactionCheckInterval)
  },
  
  // 检查交互状态
  checkInteractionState() {
    if (this.data.showResult || this.data.hasClosedResult) return
    
    const now = Date.now()
    const isAccelerating = (now - this.lastAccelTime) < 300 
    const isCurrentlyInteracting = isAccelerating || this.isTouching
    
    if (!this.data.isInteracting && isCurrentlyInteracting) {
      this.onInteractionStart()
    }
    
    if (this.data.isInteracting && !isCurrentlyInteracting) {
      this.onInteractionStop()
    }
    
    if (this.data.isInteracting && this.data.isDataReady && !this.data.showResult) {
      this.triggerFortuneReveal()
    }
  },
  
  // 交互开始
  onInteractionStart() {
    this.setData({
      isInteracting: true,
      hintText: '' 
    })
    this.playShakeSound()
  },
  
  // 交互停止
  onInteractionStop() {
    this.setData({
      isInteracting: false,
      hintText: '心诚则灵，感受当下'
    })
    this.stopShakeSound()
  },
  
  // 屏幕触摸开始
  onTouchStart() {
    if (this.data.showResult || this.data.hasClosedResult) return
    this.isTouching = true
  },
  
  // 屏幕触摸结束
  onTouchEnd() {
    this.isTouching = false
  },

  // 【关键】预加载AI签文数据
  preloadFortuneData() {
    const todayKey = this.getTodayDateKey()
    const savedFortuneData = wx.getStorageSync('fortune_data')
    if (savedFortuneData && savedFortuneData.date === todayKey) {
      return
    }
    
    this.setData({ isGenerating: true })
    this.preloadBackgroundImage()

    this.callAIForFortune().then((fortuneData: FortuneData) => {
      const { verseLines, verseLine1, verseLine2 } = this.processVerseForDisplay(fortuneData.verse)
      this.setData({
        fortuneData: fortuneData,
        verseLines: verseLines, 
        verseLine1: verseLine1, 
        verseLine2: verseLine2, 
        isDataReady: true 
      })
    }).catch((error: any) => {
      console.error('预加载签文失败:', error)
      const defaultFortune = {
        level: 'good',
        levelText: '中吉',
        verse: '一盏清茶 慢煮光阴\n心若从容 自有芬芳',
        suitable: '在窗边发呆十分钟',
        unsuitable: '对未发生的事过度焦虑',
        message: '世界喧嚣，守住内心的安静便是一场修行。不必急着赶路，有些风景只有慢下来才能看清。今日宜向内看，听听自己心底的声音。'
      }
      const { verseLines, verseLine1, verseLine2 } = this.processVerseForDisplay(defaultFortune.verse)
      this.setData({
        fortuneData: defaultFortune,
        verseLines: verseLines,
        verseLine1: verseLine1,
        verseLine2: verseLine2,
        isDataReady: true
      })
    }).finally(() => {
      this.setData({ isGenerating: false })
    })
  },
  
  // 预加载Bing随机背景图
  preloadBackgroundImage() {
    const timestamp = Date.now()
    const imageUrl = `https://bing.img.run/rand_m.php?t=${timestamp}`
    wx.getImageInfo({
      src: imageUrl,
      success: (res) => {
        this.setData({ backgroundImage: res.path })
      }
    })
  },
  
  // 触发签文显现
  triggerFortuneReveal() {
    this.stopShakeSound()
    this.setData({
      isInteracting: false,
      hintText: ''
    })
    wx.vibrateShort({ type: 'heavy' })
    this.setData({ stickState: 'dropping' })

    setTimeout(() => {
      this.setData({ stickState: 'dropped' })
      setTimeout(() => {
        this.showFortuneResult()
      }, 500)
    }, 1000)
  },

  // 处理签语为显示格式
  processVerseForDisplay(verse: string): { verseLines: string[], verseLine1: string, verseLine2: string } {
    const parts = verse.split(/[\n\s]+/).filter(p => p.trim())
    if (parts.length >= 4) {
      const verseLines = parts.slice(0, 4)
      return { verseLines, verseLine1: parts[0], verseLine2: parts[1] }
    }
    const lines = verse.split('\n').filter(line => line.trim())
    const verseLines = lines.map(l => l.trim())
    return { verseLines, verseLine1: lines[0] || '', verseLine2: lines[1] || '' }
  },

  // 调用AI生成签文
  callAIForFortune(): Promise<FortuneData> {
    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 6 ? '破晓' : hour < 12 ? '清晨' : hour < 18 ? '午后' : '夜幕'

    // 随机注入一个"灵感维度"，强制 AI 改变视角，避免每日内容雷同
    const inspirations = [
      '草木灵性：以植物的生长或凋零为隐喻',
      '市井烟火：以街角、热茶、书店等日常场景为背景',
      '山川远意：以远方的云、深山的雨、大海的潮汐为意象',
      '内心景观：以梦境、回忆、纯粹的情绪为切入点',
      '物候流转：不限于当前季节，可以谈论时间的广阔',
      '极简禅意：以留白、无声、瞬间的寂静为基调'
    ]
    const randomInspiration = inspirations[Math.floor(Math.random() * inspirations.length)]
    
    const systemPrompt = `# Role
你是一位居住在东方古老神龛中的"签灵"。你通晓《易经》的智慧，兼具现代心理学的治愈感。你的话语如清泉洗心，简练、深邃、充满画面感。

# Task
请为用户生成一份【每日一签】。

# Important: 拒绝重复与平庸
- **不要总是描写当前的季节或节气**。如果现在是冬天，你可以写写"心中未凋谢的花"或者"对春天的遥想"。
- **意象要具体且独特**。避免使用陈词滥调的词汇。
- **强制多样化**：禁止使用"今日的你..."、"在这个季节..."等固定套路。每次生成的内容必须具有独特的质感。

# Output Format (JSON)
必须严格按以下 JSON 格式输出，不要输出任何其他内容：

\`\`\`json
{
  "level": "great/good/medium/fair/guard",
  "levelText": "大吉/中吉/小吉/平/守",
  "verse": "2行签语，每行2个词语（词语间用1个空格分隔），用\\n分隔",
  "message": "深度解读(50-80字)，结合灵感维度【${randomInspiration}】，文风文艺且有独特的文学质感",
  "suitable": "一件极具画面感的小事",
  "unsuitable": "一种微妙的负面心态或行为"
}
\`\`\`

# Style Guidelines
1. **签语 (Verse)**：
   - 必须有画面感。例如："屋檐滴雨 湿了诗稿\\n茶烟袅袅 慢了流年"。
   - 追求"陌生化"的表达，拒绝陈词滥调。

2. **书灵解读 (Message)**：
   - 像是在一封泛黄的信纸上写给读者的私语。
   - 侧重于情绪的共鸣，像是在深夜为对方递上一盏灯。

3. **宜/忌 (Suitable/Unsuitable)**：
   - 宜：去河边看一次夕阳、在书页里夹一片落叶、修剪一盆枯萎的枝条。
   - 忌：追问没有意义的结果、在人群中假装忙碌、为了合群而沉默。`

    const userPrompt = `今天是${this.data.todayDate}，${timeOfDay}时分。我的灵感种子是：${randomInspiration}。请开启今日缘分。`

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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 1, // 最高随机性
          top_p: 1.0
        },
        success: (res: any) => {
          try {
            if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
              const content = res.data.choices[0].message.content
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0]
                resolve(JSON.parse(jsonStr))
              } else {
                throw new Error('AI返回格式异常')
              }
            } else {
              throw new Error('API返回异常')
            }
          } catch (error) {
            reject(error)
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  },

  // 显示签文结果
  showFortuneResult() {
    const todayKey = this.getTodayDateKey()
    const savedFortuneData = wx.getStorageSync('fortune_data')
    if (savedFortuneData && savedFortuneData.date !== todayKey) {
      wx.removeStorageSync('fortune_data')
      this.setData({ fortuneData: null, hasClosedResult: false, hintText: '心诚则灵，感受当下' })
      wx.showToast({ title: '请重新抽签', icon: 'none' })
      this.preloadFortuneData()
      return
    }
    
    if (!this.data.fortuneData) {
      wx.showToast({ title: '签文生成中...', icon: 'none' })
      return
    }

    this.stopShakeSound()
    this.stopHapticFeedback()

    this.setData({
      showResult: true,
      displayedMessage: this.data.fortuneData.message
    })

    wx.vibrateShort({ type: 'heavy' })
    this.saveTodayFortune(this.data.fortuneData)
  },

  // 关闭结果
  onCloseResult() {
    wx.vibrateShort({ type: 'light' })
    const todayKey = this.getTodayDateKey()
    const savedFortuneData = wx.getStorageSync('fortune_data')
    if (savedFortuneData && savedFortuneData.date === todayKey) {
      this.setData({
        showResult: false,
        hasClosedResult: true,
        hintText: '今日缘分已定，点击查看您的签文'
      })
      return
    }

    this.setData({
      showResult: false,
      stickState: 'hidden',
      fortuneData: null,
      verseLines: [],
      displayedMessage: '',
      hintText: '心诚则灵，感受当下',
      hasClosedResult: false,
      isDataReady: false
    })
  },

  // 阻止冒泡
  onPreventDefault() {},

  // 保存今日签
  onSaveFortune() {
    wx.vibrateShort({ type: 'medium' })
    if (!this.data.fortuneData) return
    wx.showLoading({ title: '生成中...' })
    this.drawFortuneImage().then(() => {
      wx.hideLoading()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    })
  },

  // 绘制海报
  drawFortuneImage(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const query = wx.createSelectorQuery()
      query.select('#fortuneCanvas')
        .fields({ node: true, size: true })
        .exec(async (res) => {
          if (!res || !res[0] || !res[0].node) {
            reject(new Error('Canvas失败'))
            return
          }

          try {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            const dpr = wx.getSystemInfoSync().pixelRatio
            const canvasWidth = 375
            const canvasHeight = 667
            canvas.width = canvasWidth * dpr
            canvas.height = canvasHeight * dpr
            ctx.scale(dpr, dpr)

            const fortuneData = this.data.fortuneData!

            // 1. 背景
            ctx.fillStyle = '#F8F5F0'
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)

            // 2. 顶部图
            const headerHeight = 220
            if (this.data.backgroundImage) {
              const bgImage = canvas.createImage()
              bgImage.src = this.data.backgroundImage
              await new Promise<void>((r) => {
                bgImage.onload = () => {
                  ctx.save()
                  ctx.beginPath()
                  ctx.rect(0, 0, canvasWidth, headerHeight)
                  ctx.clip()
                  ctx.drawImage(bgImage, 0, 0, canvasWidth, headerHeight)
                  ctx.restore()
                  r()
                }
                bgImage.onerror = r
              })
            }

            // 3. 印章
            const stampColor = fortuneData.level === 'great' ? '#D4AF37' : '#8B2222'
            ctx.save()
            ctx.translate(canvasWidth - 50, headerHeight - 30)
            ctx.rotate(15 * Math.PI / 180)
            ctx.strokeStyle = stampColor
            ctx.lineWidth = 2
            this.roundRect(ctx, -18, -22, 36, 44, 2)
            ctx.stroke()
            ctx.font = 'bold 16px STKaiti, serif'
            ctx.fillStyle = stampColor
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(fortuneData.levelText, 0, 0)
            ctx.restore()

            // 4. 签文
            const verseLines = this.data.verseLines
            ctx.font = '500 17px STKaiti, serif'
            ctx.fillStyle = '#333333'
            ctx.textAlign = 'center'
            const startX = canvasWidth / 2 + (verseLines.length - 1) * 20
            verseLines.forEach((line, i) => {
              const x = startX - i * 40
              line.split('').forEach((char, j) => {
                ctx.fillText(char, x, headerHeight + 50 + j * 22)
              })
            })

            // 5. 宜忌
            const adviceY = canvasHeight - 230 // 向上大幅移动，从 160 改为 230
            ctx.textAlign = 'left'
            ctx.font = '600 12px PingFang SC'
            
            const adviceX = (canvasWidth - 280) / 2 // 稍微调宽绘制区域
            const adviceMaxWidth = 250 // 宜忌文字最大宽度
            
            // 宜
            ctx.fillStyle = '#52C41A'
            ctx.beginPath()
            ctx.arc(adviceX, adviceY - 4, 3, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.fillStyle = '#999999'
            ctx.fillText('宜', adviceX + 12, adviceY)
            
            ctx.fillStyle = '#666666'
            ctx.font = '12px PingFang SC'
            // 宜的内容也增加自动换行处理
            const suitableLines = this.wrapText(ctx, fortuneData.suitable, adviceMaxWidth)
            suitableLines.forEach((line: string, i: number) => {
              ctx.fillText(line, adviceX + 35, adviceY + i * 18)
            })
            
            // 忌
            const unsuitableY = adviceY + (suitableLines.length * 18) + 4
            ctx.fillStyle = '#F5222D'
            ctx.beginPath()
            ctx.arc(adviceX, unsuitableY - 4, 3, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.fillStyle = '#999999'
            ctx.font = '600 12px PingFang SC'
            ctx.fillText('忌', adviceX + 12, unsuitableY)
            
            ctx.fillStyle = '#666666'
            ctx.font = '12px PingFang SC'
            const unsuitableLines = this.wrapText(ctx, fortuneData.unsuitable, adviceMaxWidth)
            unsuitableLines.forEach((line: string, i: number) => {
              ctx.fillText(line, adviceX + 35, unsuitableY + i * 18)
            })

            // 6. 书灵寄语
            const messageY = unsuitableY + (unsuitableLines.length * 18) + 25
            ctx.textAlign = 'center'
            ctx.fillStyle = '#CCCCCC'
            ctx.font = '10px PingFang SC'
            ctx.fillText('◆', canvasWidth / 2, messageY)
            
            ctx.fillStyle = '#888888'
            ctx.font = 'italic 11px PingFang SC'
            const messageLines = this.wrapText(ctx, fortuneData.message, 280)
            messageLines.forEach((line: string, i: number) => {
              ctx.fillText(line, canvasWidth / 2, messageY + 18 + i * 18)
            })

            // 7. 底部标识
            ctx.font = '11px PingFang SC'
            ctx.fillStyle = '#CCCCCC'
            ctx.fillText('—— 来自《当下有解》极简纸签 ——', canvasWidth / 2, canvasHeight - 40)

            setTimeout(() => {
              wx.canvasToTempFilePath({
                canvas,
                success: (res) => {
                  wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                      wx.showToast({ title: '已存至相册', icon: 'success' })
                      resolve()
                    },
                    fail: reject
                  })
                },
                fail: reject
              })
            }, 300)
          } catch (e) {
            reject(e)
          }
        })
    })
  },

  roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  },

  wrapText(ctx: any, text: string, maxWidth: number): string[] {
    const lines = []
    let currentLine = ''
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const testLine = currentLine + char
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  },

  onShareAppMessage() {
    const fortuneData = this.data.fortuneData
    return {
      title: fortuneData ? `今日缘分：我抽到了「${fortuneData.levelText}」签` : '今日一签 - 当下有解',
      path: '/pages/fortune/fortune'
    }
  },

  onBack() { wx.navigateBack() },

  onLongPressTitle() {
    wx.showModal({
      title: '调试',
      content: '清除今日签文缓存？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('fortune_data')
          wx.reLaunch({ url: '/pages/fortune/fortune' })
        }
      }
    })
  },

  onUnload() {
    if (this.shakeAudio) this.shakeAudio.destroy()
    clearInterval(this.hapticTimer)
    clearInterval(this.interactionCheckTimer)
  }
})
