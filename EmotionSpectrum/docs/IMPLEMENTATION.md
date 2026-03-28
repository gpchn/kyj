# EmotionSpectrum (情绪光谱) - Technical Implementation

## 1. Project Overview

### Project Information
- **Project Name**: EmotionSpectrum
- **Project Type**: Interactive Sound Visualization Art
- **Core Feature**: Real-time sound-to-color fluid painting
- **目标用户**: 艺术展览、音乐活动、冥想体验

### 技术栈
- **渲染引擎**: HTML5 Canvas 2D Context
- **音频处理**: Web Audio API (AnalyserNode)
- **动画系统**: requestAnimationFrame
- **构建工具**: 原生 HTML/CSS/JavaScript

---

## 2. 技术架构

### Module Structure
```
EmotionSpectrum/
├── index.html              # Main entry
├── src/
│   ├── main.js             # Application entry
│   ├── audioAnalyzer.js    # Audio analyzer
│   ├── emotionEngine.js    # Emotion detection engine
│   ├── utils.js            # Utility functions
│   └── visualizers/        # Visualization modes
│       ├── waveVisualizer.js
│       ├── particleVisualizer.js
│       ├── spiralVisualizer.js
│       └── kaleidoscopeVisualizer.js
│   └── utils.js            # 工具函数
├── assets/
│   └── shaders/            # 着色器目录(备用)
└── docs/
    ├── SPEC.md             # 规格说明书
    └── IMPLEMENTATION.md   # 本文档
```

### 核心类设计

#### AudioAnalyzer (音频分析器)
```javascript
class AudioAnalyzer {
  constructor()
  audioContext              // AudioContext 实例
  analyser                  // AnalyserNode
  dataArray                 // 频谱数据数组
  async init()              // 初始化麦克风
  getVolume()               // 获取当前音量 (0-1)
  getFrequency()            // 获取主频率
  start()                   // 开始分析
  stop()                    // 停止分析
}
```

#### FluidRenderer (流体渲染器)
```javascript
class FluidRenderer {
  constructor(canvas)
  particles[]               // 粒子数组
  noiseField                // Perlin噪声场
  addParticle(x, y, color)  // 添加粒子
  update(deltaTime)         // 更新所有粒子
  render()                  // 渲染流体
  clear()                   // 清空画布
}
```

#### Particle (粒子类)
```javascript
class Particle {
  constructor(x, y, color, size)
  x, y                      // 位置
  vx, vy                    // 速度
  color                     // 颜色
  size                      // 尺寸
  life                      // 生命周期
  update(noiseValue)        // 更新位置
  render(ctx)               // 绘制粒子
  isDead()                  // 判断是否消亡
}
```

---

## 3. 渲染管线

### 绘制流程
```
1. 获取音频/鼠标输入数据
2. 计算当前音量/速度
3. 映射到色彩和流速
4. 生成新粒子
5. 更新所有粒子位置
6. 渲染粒子到画布
7. 应用模糊效果增加流动感
```

### 粒子生命周期
```
生成 → 扩散 → 衰减 → 消亡 → 回收
```

---

## 4. 交互实现

### 音频模式
```javascript
// 初始化麦克风
async function initAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
}
```

### 鼠标模式
```javascript
// 计算鼠标速度
function calculateMouseSpeed(currentPos, lastPos, deltaTime) {
  const dx = currentPos.x - lastPos.x;
  const dy = currentPos.y - lastPos.y;
  return Math.sqrt(dx * dx + dy * dy) / deltaTime;
}
```

---

## 5. 色彩映射算法

### 音量到色彩映射
```javascript
function mapVolumeToColor(volume) {
  // volume: 0-1
  // 低音量 → 冷色调 (蓝紫)
  // 高音量 → 暖色调 (红橙)
  const hue = 240 - volume * 240;  // 240(蓝) → 0(红)
  const saturation = 70 + volume * 30;
  const lightness = 50 + volume * 20;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
```

### 流速映射
```javascript
function mapVolumeToFlowSpeed(volume) {
  const baseSpeed = 0.5;
  const maxSpeed = 5;
  return baseSpeed + volume * (maxSpeed - baseSpeed);
}
```

---

## 6. 视觉效果参数

### 粒子系统参数
```javascript
const PARTICLE_CONFIG = {
  maxParticles: 1000,
  minSize: 2,
  maxSize: 20,
  baseLife: 3000,          // 基础生命周期(ms)
  fadeRate: 0.002,         // 淡出速率
  spawnRate: 10            // 每帧生成数量
};
```

### 噪声场参数
```javascript
const NOISE_CONFIG = {
  scale: 0.005,            // 噪声缩放
  speed: 0.001,            // 演化速度
  strength: 2              // 影响强度
};
```

---

## 7. 性能优化策略

### 粒子池
- 预分配粒子对象
- 消亡粒子复用而非新建

### 渲染优化
- 使用离屏 Canvas 合成
- 批量绘制相同颜色粒子

### 音频优化
- 降低采样率到 22050Hz
- 使用平滑算法减少抖动

---

## 8. 质量验收标准

### 功能验收
- [ ] 麦克风输入正常工作
- [ ] 鼠标模式正常工作
- [ ] 色彩映射准确
- [ ] 流体效果自然
- [ ] 模式切换流畅

### 性能验收
- [ ] 桌面端 60fps 稳定
- [ ] 1000 粒子时无卡顿
- [ ] 音频延迟 < 100ms

### 视觉验收
- [ ] 色彩过渡平滑
- [ ] 流体质感自然
- [ ] 冷暖色调区分明显
- [ ] 画面有呼吸感

### 兼容性验收
- [ ] Chrome/Edge/Firefox 正常
- [ ] Safari 音频权限正常
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
