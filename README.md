# 心之解惑 / AI答案之书 - 项目说明

## 项目概述

这是一个基于微信小程序的心理疗愈类产品,为面临焦虑、有选择困难症、追求生活仪式感的年轻人提供随机答案与AI心理疏导。

### 核心特色
- 🎨 **极简禅意风格** - 深夜模式 + 莫兰迪疗愈色系
- 💫 **沉浸式交互** - 长按触发,配合震动反馈与音效
- 📖 **拟物化书页动画** - 3D翻页效果,营造仪式感
- 🤖 **AI深度解读** - 结合问题类型和随机答案生成治愈系文字
- 📤 **精美分享卡片** - 支持生成长图分享到朋友圈

## 项目结构

```
wewish/
├── program/                    # 小程序主目录
│   └── miniprogram/
│       ├── pages/
│       │   ├── home/          # 首页(问题分类选择)
│       │   ├── seeking/       # 交互页(长按翻书动画)
│       │   └── result/        # 结果页(答案展示+AI解读)
│       ├── utils/
│       │   ├── answers.ts     # 答案池、禅语库等工具函数
│       │   └── util.ts
│       ├── app.ts             # 全局配置
│       ├── app.json           # 页面路由配置
│       └── app.less           # 全局样式
├── scripts/                   # 文档目录
│   ├── 大纲.md               # 项目需求大纲
│   ├── 设计稿描述.md         # 详细视觉设计说明
│   ├── 交互逻辑.md           # 核心交互流程文档
│   └── AI_Prompt策略.md      # AI解读系统提示词
└── README.md                  # 项目说明(本文件)
```

## 功能模块

### 1. 首页 (Home)
- **每日一签**: 基于日期生成的禅意签文
- **问题分类**: 情感/事业/学业/财富/通用 五大类型
- **核心按钮**: 带呼吸动画的交互入口

**技术要点**:
- 使用CSS动画实现呼吸效果(`@keyframes breathe`)
- 震动反馈:`wx.vibrateShort()`
- 状态管理:选中类别后才能进入下一步

### 2. 交互页 (Seeking)
用户长按后进入,展示沉浸式动画效果:

- **书页翻动**: 3D CSS Transform实现书页快速翻过
- **粒子特效**: Canvas绘制光点汇聚效果(可选)
- **进度条**: 假进度条模拟等待过程
- **禅语轮播**: 自动切换禅意文案
- **持续震动**: 每300ms轻震一次

**交互逻辑**:
1. 用户按住屏幕 → 启动所有动画
2. 持续2秒以上才能松开(否则提示)
3. 松开手指 → 停止动画 → 跳转结果页

**技术要点**:
- `bindtouchstart` / `bindtouchend` / `bindtouchcancel`
- 定时器管理(翻页/震动/进度/禅语)
- 页面隐藏时中断并提示用户

### 3. 结果页 (Result)
展示随机答案并提供AI解读:

- **答案展示**: 大字号渐变文字,带进场动画
- **装饰元素**: 闪烁的星星,流光分隔线
- **AI解读**: 点击展开,打字机效果呈现
- **操作按钮**: 再问一次 / 生成卡片

**AI解读逻辑**:
- 首次展开时调用生成函数
- 目前使用本地Mock数据
- 支持接入OpenAI/GPT API
- 打字机效果:50ms/字,每5字轻震

**技术要点**:
- 答案随机算法(可扩展为加权)
- 文字逐字显示(`setInterval`)
- Canvas生成分享卡片(待实现)

## 技术栈

- **框架**: 微信小程序原生框架
- **语言**: TypeScript + LESS
- **渲染**: Skyline渲染引擎(glass-easel组件框架)
- **API**: 
  - `wx.vibrateShort()` - 震动反馈
  - `wx.createInnerAudioContext()` - 音频播放(可选)
  - `wx.createCanvasContext()` - Canvas绘制(可选)

## 核心文档

### 1. 设计稿描述 (`scripts/设计稿描述.md`)
包含三个主页面的详细视觉布局说明:
- 首页布局(标题/每日一签/分类/按钮)
- 交互页动画设计(书页/粒子/进度条)
- 结果页结构(答案/解读/分享卡片)
- 全局交互规范(震动/音效/动画时长)

### 2. 交互逻辑 (`scripts/交互逻辑.md`)
详细拆解"长按-松开-弹出"核心机制:
- 5个交互阶段的技术实现
- 异常情况处理(中断/网络异常/误触)
- 性能优化策略
- 时间节奏控制

### 3. AI Prompt策略 (`scripts/AI_Prompt策略.md`)
"书灵"AI解读系统的完整指南:
- System Prompt模板
- 5类问题的解读示例(Few-Shot)
- 质量控制Checklist
- API集成示例(OpenAI)
- Fallback机制

## 开发指南

### 环境准备
1. 安装微信开发者工具
2. 打开项目:`/program` 目录
3. 选择小程序项目,导入

### 本地开发
```bash
cd program
# 如需安装依赖(目前无外部依赖)
npm install
```

### 调试建议
- 使用真机调试体验震动效果
- 模拟器无法完整展示震动和音效
- 注意检查不同机型的安全区适配

## 待完善功能

### 高优先级
- [ ] 音效文件集成(翻页/揭晓/背景音)
- [ ] Canvas粒子特效完整实现
- [ ] 分享卡片Canvas绘制
- [ ] 历史记录功能
- [ ] 真实的AI接口集成

### 中优先级
- [ ] 每日一签点击跳转详情页
- [ ] 用户输入问题文本框(可选)
- [ ] 答案收藏功能
- [ ] 数据埋点(用户行为分析)

### 低优先级
- [ ] 多主题切换(浅色模式)
- [ ] 农历转换API接入
- [ ] 社区功能(查看其他人的答案)
- [ ] 付费解锁高级解读

## 性能优化建议

### 动画性能
- ✅ 使用`transform`和`opacity`触发GPU加速
- ✅ 避免使用`width`/`height`等触发重排的属性
- ⚠️ Canvas粒子数量控制在100个以内
- ⚠️ 定时器及时清理,避免内存泄漏

### 首屏加载
- ✅ 图片使用WebP格式,单张≤50KB
- ⚠️ 音效文件懒加载(首次长按时才加载)
- ⚠️ 避免自定义字体加载延迟

### 小程序包大小
- 当前主包大小: < 500KB
- 建议采用分包加载策略(历史记录页/设置页)

## API集成示例

### OpenAI GPT集成
```javascript
// 在result.ts中替换generateAIAnalysis方法
async generateAIAnalysis() {
  try {
    const response = await wx.request({
      url: 'https://your-server.com/api/ai-analysis',
      method: 'POST',
      data: {
        category: this.data.category,
        answer: this.data.answer
      }
    })
    
    this.setData({ fullAnalysis: response.data.analysis })
    this.startTypewriter(response.data.analysis)
  } catch (error) {
    // 使用Fallback
    const fallback = this.getMockAnalysis(...)
    this.startTypewriter(fallback)
  }
}
```

### 后端服务需求
- 接口路径: `POST /api/ai-analysis`
- 请求参数:
  ```json
  {
    "category": "emotion",
    "answer": "勇敢表达",
    "userQuestion": "我该不该表白?" // 可选
  }
  ```
- 响应格式:
  ```json
  {
    "analysis": "亲爱的朋友,...",
    "timestamp": "2026-01-28T12:00:00Z"
  }
  ```

## 设计理念

> 通过极简的视觉语言和富有仪式感的交互,让用户在短暂的"冥想时刻"获得心理慰藉,而非单纯的随机答案。

### 核心价值观
1. **仪式感** - 长按等待的过程本身就是一种冥想
2. **留白** - AI解读不给具体建议,而是引导思考
3. **治愈性** - 每个文案都传递希望和温暖
4. **美学** - 视觉设计追求极简而不简单

## 许可证

本项目仅供学习交流使用。

## 联系方式

如有问题或建议,欢迎联系项目负责人。

---

**版本**: v1.0.0  
**最后更新**: 2026-01-28  
**开发者**: Horry Huang
