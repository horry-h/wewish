# 摇签音效说明

## 📢 音效文件配置

当前实现中，摇签音效临时使用了 `/assets/audio/page-flip.wav`。

### 建议替换为专业音效

为了获得最佳体验，建议替换为真实的"木签摇动"音效。

#### 推荐音效类型：
1. **竹筒摇签声** - 搜索关键词："bamboo stick shaking"、"fortune stick"
2. **木质摩擦声** - 多根木签相互碰撞的声音
3. **节奏型摇动声** - 有节奏的"哗啦哗啦"声

#### 音效要求：
- **格式**: WAV / MP3
- **时长**: 1-3秒（会自动循环播放）
- **音量**: 中等，不要太尖锐
- **特征**: 柔和的木质碰撞声，带有禅意氛围

### 替换步骤：

1. 下载或制作摇签音效文件
2. 将文件放入 `/miniprogram/assets/audio/` 目录
3. 命名建议：`shake-fortune.wav` 或 `shake-fortune.mp3`
4. 修改 `fortune.ts` 中的音效路径：

```typescript
// 在 initShakeAudio() 方法中
this.shakeAudio.src = '/assets/audio/shake-fortune.wav' // 改为新的音效路径
```

### 免费音效资源网站：

- **Freesound**: https://freesound.org/
- **Zapsplat**: https://www.zapsplat.com/
- **Pixabay Music**: https://pixabay.com/music/
- **爱给网**: https://www.aigei.com/sound/

搜索关键词：`fortune stick`, `bamboo shake`, `wooden stick`, `签筒`

## 🎵 音效播放逻辑

### 当前实现：

1. **开始播放**: 检测到用户开始摇动手机时
2. **循环播放**: 使用 `loop: true` 持续播放
3. **停止播放**: 
   - 摇动完成触发签条掉落时
   - 超过1秒没有摇动时（自动暂停）

### 代码位置：

- **初始化**: `initShakeAudio()` 方法
- **播放控制**: `playShakeSound()` / `stopShakeSound()`
- **自动停止**: `handleAccelerometerChange()` 中的逻辑

## 💡 优化建议

如果你有更好的音效创意，可以考虑：

1. **分层音效**:
   - 背景音：持续的摇动声
   - 前景音：每次摇动时的重点碰撞声

2. **音效变化**:
   - 根据摇动强度调整音量
   - 接近完成时改变音色（增加紧张感）

3. **空间音效**:
   - 使用左右声道模拟签筒的方向性
