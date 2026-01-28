# AI 真实调用说明

## 修改概述
移除了所有 Mock 数据和兜底逻辑，确保书灵解读**只调用真实的混元 API**，提升内容质量和真实性。

## 核心修改

### 1. 移除 Mock 方法
**删除内容**: `getMockAnalysis()` 方法及其所有模板数据（共约 50 行代码）

**原功能**:
- 包含 7 个分类的预设解读模板
- API 调用失败时作为兜底内容
- 固定话术，缺乏个性化

**删除理由**:
- Mock 数据无法根据用户实际问题生成针对性回复
- 固定模板缺乏变化，影响用户体验
- 真实 API 调用才能发挥分类增强指令的作用

---

### 2. 修改错误处理逻辑
**位置**: `home.ts` - `generateAIAnalysis()` 方法

**修改前**:
```typescript
try {
  const analysis = await this.callHunyuanAPI(...)
  this.startTypewriter(analysis)
} catch (error) {
  console.error('生成AI解读失败:', error)
  // ❌ 使用本地 Mock 兜底
  const analysis = this.getMockAnalysis(this.data.selectedCategory, this.data.resultAnswer)
  this.setData({ fullAnalysis: analysis })
  this.startTypewriter(analysis)
}
```

**修改后**:
```typescript
try {
  const analysis = await this.callHunyuanAPI(...)
  this.startTypewriter(analysis)
} catch (error) {
  console.error('生成AI解读失败:', error)
  // ✅ 直接显示错误提示，不使用 Mock
  this.setData({
    fullAnalysis: '书灵暂时无法连接，请稍后再试...',
    displayedAnalysis: '书灵暂时无法连接，请稍后再试...',
    isTyping: false
  })
}
```

---

## API 调用流程

### 完整调用链路
```
用户点击展开书灵解读
    ↓
onAnalysisToggle()
    ↓
generateAIAnalysis()
    ↓
callHunyuanAPI()
    ↓
【构建分类增强指令】
    ↓
【发送 wx.request 到混元 API】
    ↓
【接收真实 AI 生成内容】
    ↓
startTypewriter() 打字机显示
```

### API 配置
```typescript
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
      { role: 'system', content: systemPrompt + categoryEnhancement },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.9,
    top_p: 0.95,
    enable_enhancement: true
  }
})
```

---

## 错误处理策略

### 可能的错误场景
| 错误类型 | 显示内容 | 用户操作建议 |
|---------|---------|------------|
| 网络超时 | "书灵暂时无法连接，请稍后再试..." | 关闭后重新点击 |
| API 格式异常 | "书灵暂时无法连接，请稍后再试..." | 关闭后重新点击 |
| 授权失败 | "书灵暂时无法连接，请稍后再试..." | 联系开发者检查 API Key |

### 用户体验优化
- ❌ **不推荐**: 用 Mock 数据欺骗用户，降低产品可信度
- ✅ **推荐**: 诚实告知连接失败，鼓励用户重试
- ✅ **未来优化**: 可添加"重试"按钮，无需关闭卡片

---

## 对比：Mock vs 真实 API

### 示例：用户问"该不该换工作？"，答案"再等等"

**Mock 模板**（固定话术）:
> 亲爱的朋友，
> 
> 耐心，是这个时代最稀缺的美德。"再等等"不是逃避，而是在为更好的时机积蓄力量。就像果实需要时间成熟，有些机会也需要等待最佳的时刻。此刻的沉潜，是为了未来更高的飞翔。
> 
> 愿你在等待中，变得更加强大。
> 
> —— 书灵 🌙

**真实 API**（结合分类增强指令）:
> 站在山顶的行者，看得见远方，也看得见脚下的路。你选了"工作与事业"，我感受到你内心的动摇与期待。
> 
> 书页翻到了"再等等"——这不是让你停滞，而是在提醒你：换工作是一场迁徙，不是逃离。此刻的等待，是为了让你看清什么才是真正的弯道，而不是悬崖。
> 
> 去观察、去积累、去确认。当时机成熟时，那条路会自己发光。
> 
> —— 书灵 🌙

**差异分析**:
- Mock：通用话术，适用所有"再等等"的情况
- API：结合了"工作与事业"的增强指令，使用"山顶行者""迁徙""弯道"等专属隐喻
- API 更具针对性，更贴合用户的实际困惑

---

## 依赖检查

### 必须配置
✅ 微信小程序后台 → 开发设置 → 服务器域名 → request 合法域名
```
https://api.hunyuan.cloud.tencent.com
```

### API Key 管理
⚠️ **当前状态**: API Key 硬编码在前端代码中
```typescript
'Authorization': 'Bearer sk-h7vMtZVg5ZD6wGqIOIYb9TiFOSZNuBgQk9JjetcaMewlUix8'
```

⚠️ **安全风险**: 
- 前端代码可被反编译，API Key 可能泄露
- 恶意用户可能盗用 Key 进行大量调用

✅ **生产环境建议**:
1. 将 API 调用改为**后端代理**
2. 前端调用自己的服务器，后端再调用混元 API
3. 在后端进行鉴权和频率限制

---

## 更新日志

- **2026-01-28**：移除 Mock 数据，确保只调用真实混元 API
- **2026-01-28**：优化错误提示，不再使用兜底内容
