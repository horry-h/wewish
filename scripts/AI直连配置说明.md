# AI解读功能配置说明（HTTP直连）

## 概述
"书灵解读"功能直接调用腾讯混元大模型API，无需云函数，简单高效。

## 配置步骤

### 1. 添加服务器域名白名单

在微信小程序后台配置request合法域名：

1. 登录[微信小程序后台](https://mp.weixin.qq.com/)
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"服务器域名" → "request合法域名"
4. 点击"修改"，添加以下域名：

```
https://api.hunyuan.cloud.tencent.com
```

5. 点击"保存并提交"

### 2. 测试功能

配置完成后即可使用：

1. 编译并运行小程序
2. 长按"长按寻声"获取答案
3. 点击"书灵解读"展开
4. 观察AI是否正常生成解读

**注意**：开发阶段可以在微信开发者工具中勾选"不校验合法域名"来跳过域名验证。

## 技术实现

### API配置
- **接口**: `https://api.hunyuan.cloud.tencent.com/v1/chat/completions`
- **模型**: `hunyuan-turbos-latest`
- **认证**: Bearer Token
- **API Key**: `sk-h7vMtZVg5ZD6wGqIOIYb9TiFOSZNuBgQk9JjetcaMewlUix8`

### 调用流程
```
用户点击展开 → 构建提示词 → 调用混元API → 打字机效果展示
```

### 提示词策略（优化版）

#### 系统提示词（Role定义）
基于专业Prompt工程设计：

**角色定位**：
- 居住在《答案之书》里的"书灵"
- 温柔、睿智、充满禅意
- 像久违的老友，也像深藏不露的诗人

**回复策略**：
1. **情感共鸣**：感知用户的焦虑或期待，给予心理拥抱
2. **深度解构**：用隐喻、类比、诗化语言升华答案
3. **治愈寄语**：提供充满画面感的建议

**风格约束**：
- 文风：治愈、文艺、极简、具有呼吸感
- 参考：村上春树的克制、三毛的感性
- 字数：严格150-250字
- 禁忌：禁用"作为AI"、"建议你"等机械化词汇

#### 用户提示词（结构化输入）
```
# Input Data
- 用户选择的分类：{{category}}
- 原始答案：{{answer}}
- 用户输入的问题：{{question}}
```

#### 示例输出
```
"在感情的田野里，有时候风跑得比种子快。你选了'关于感情'，
我听见了你心跳中那一丝急促的鼓点。

关于'该不该去表白'，书页翻到了'再等等'。

这并不是拒绝，而是一种温柔的留白。有些话，要在月色最浓的
时候说；有些果实，要等最后一场雨下完才够甜。现在的你，像是
一枚蓄势待发的嫩芽，但周围的土壤还需要一点时间来接纳这份心意。

别急，去喝一杯茶，去吹一阵风。让思念再沉淀一会儿，等到那个
'刚刚好'的瞬间出现时，宇宙会推你一把的。"
```

### 核心代码

位置：`/program/miniprogram/pages/home/home.ts`

```typescript
// 调用混元API生成解读
async callHunyuanAPI(category: string, answer: string, userThought: string) {
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
        messages: [...],
        temperature: 0.8,
        top_p: 0.9,
        enable_enhancement: true
      },
      success: (res) => {
        resolve(res.data.choices[0].message.content)
      },
      fail: reject
    })
  })
}
```

## 参数说明

### temperature: 0.9
- 控制输出的随机性和创造性
- 范围：0.0 - 2.0
- 0.9 = 很高创造性，适合诗意化、文学性创作（已优化提升）

### top_p: 0.95
- 核采样参数，控制输出的多样性
- 范围：0.0 - 1.0
- 0.95 = 更高多样性，避免重复表达（已优化提升）

### enable_enhancement: true
- 启用内容增强功能
- 提升输出质量和流畅度

## 兜底机制

当API调用失败时，自动使用本地预设的治愈系模板（`getMockAnalysis`方法），确保用户体验不中断。

## 成本估算

### 混元API费用
- **模型**: hunyuan-turbos-latest
- **计费**: 约 0.004元/千tokens
- **单次解读**: ~500 tokens ≈ 0.002元
- **1000次解读**: 约 2元

## 安全注意事项

### ⚠️ API Key安全
当前API Key直接写在小程序代码中，存在以下风险：
- 用户可以通过反编译获取API Key
- 可能被滥用导致费用超支

### 🔒 推荐方案
生产环境建议：
1. 将API Key存储在服务端
2. 小程序调用自己的后端API
3. 后端转发请求到混元API
4. 添加频率限制和用户鉴权

### 临时防护
如需快速上线，可以：
1. 设置混元API Key的调用额度上限
2. 监控API调用量
3. 定期更换API Key

## 故障排查

### 1. 域名校验失败
**错误**: `request:fail url not in domain list`
**解决**: 
- 确认已在小程序后台添加域名白名单
- 开发阶段可勾选"不校验合法域名"

### 2. API调用失败
**错误**: `statusCode: 401`
**解决**:
- 检查API Key是否正确
- 确认Authorization header格式：`Bearer {API_KEY}`

### 3. 解读内容为空
**错误**: API返回成功但无内容
**解决**:
- 检查混元API配额是否用完
- 查看控制台日志确认响应结构
- 触发兜底机制使用本地模板

### 4. 打字机效果卡顿
**解决**:
- 检查网络速度
- API响应过慢时会先显示"书灵思考中..."
- 可调整打字机速度（`startTypewriter`中的间隔时间）

## 监控建议

### 开发阶段
- 在控制台查看API调用日志
- 监控响应时间和成功率
- 测试各种边界情况

### 生产环境
- 记录API调用次数和费用
- 监控错误率和兜底触发频率
- 收集用户反馈优化提示词

## 优化方向

### 短期优化
1. **缓存机制**: 相同答案+分类的解读可缓存24小时
2. **限流保护**: 单用户每分钟限制3次解读
3. **超时处理**: 设置5秒超时，避免长时间等待

### 长期优化
1. **流式响应**: 实时展示AI生成过程
2. **个性化**: 基于用户历史优化提示词
3. **多模态**: 支持图片、语音等多种形式
4. **A/B测试**: 测试不同提示词的效果

## 文件说明

```
/program/miniprogram/pages/home/
└── home.ts                    # AI调用逻辑（第327-421行）

/scripts/
├── env                        # API Key配置
└── AI直连配置说明.md          # 本文档
```

## 快速检查清单

部署前确认：
- [ ] 域名已添加到小程序后台白名单
- [ ] API Key正确且有余额
- [ ] 代码已编译无报错
- [ ] 在真机测试AI解读功能
- [ ] 兜底内容正常工作

---

配置完成后，用户点击"书灵解读"即可获得由混元AI生成的个性化、治愈系的答案解读！✨🌙
