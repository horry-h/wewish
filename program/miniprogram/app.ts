// app.ts
App<IAppOption>({
  globalData: {
    statusBarHeight: 44,
    history: []
  },
  
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 44

    // 加载历史记录
    const history = wx.getStorageSync('history') || []
    this.globalData.history = history

    console.log('App launched')
  }
})