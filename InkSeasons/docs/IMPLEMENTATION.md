# InkSeasons (墨韵四季) - Technical Implementation

## 1. Project Overview

### Project Information
- **Project Name**: InkSeasons
- **Project Type**: Interactive Digital Art
- **Core Feature**: Ink painting style seasonal interaction experience
- **目标用户**: 艺术展览、教育课堂、个人欣赏

### 技术栈
- **渲染引擎**: HTML5 Canvas 2D Context
- **动画系统**: requestAnimationFrame
- **构建工具**: 原生 HTML/CSS/JavaScript (无框架依赖)
- **资源格式**: SVG 矢量图形 + Canvas 绑定

---

## 2. 技术架构

### Module Structure
```
InkSeasons/
├── index.html              # Main entry
├── src/
│   ├── main.js             # Application entry
│   ├── canvasRenderer.js   # Canvas rendering engine
│   ├── brushEngine.js      # Brush system
│   ├── seasonThemes.js     # Season themes
│   ├── interactionHandler.js # 交互事件处理
│   └── utils.js            # 工具函数库
├── assets/
│   └── textures/           # 纹理资源目录
│       └── rice-paper.svg  # 宣纸纹理
└── docs/
    ├── SPEC.md             # 规格说明书
    └── IMPLEMENTATION.md   # 本文档
```

### 核心类设计

#### InkDot (墨点类)
```javascript
class InkDot {
  constructor(x, y, season, velocity)
  update(deltaTime)        // 更新墨点状态
  render(ctx)              // 绘制墨点
  fadeOut()                // 淡出效果
  isDead()                 // 判断是否需要回收
}
```

#### SeasonController (季节控制器)
```javascript
class SeasonController {
  constructor()
  currentSeason             // 当前季节索引 0-3
  transition()              // 季节切换
  getCurrentTheme()         // 获取当前季节配色
}
```

#### InkSystem (墨系统)
```javascript
class InkSystem {
  constructor(canvas)
  dots[]                   // 墨点数组
  addDot(x, y)             // 添加墨点
  update()                 // 更新所有墨点
  render()                 // 渲染所有墨点
  clear()                   // 清空画布
}
```

---

## 3. 渲染管线

### 绘制流程
```
1. 清除画布 (保留宣纸背景)
2. 更新所有墨点状态
3. 按添加顺序绘制墨点 (旧墨点在底层)
4. 绘制季节过渡效果
5. 渲染 UI 组件
```

### 墨点生命周期
```
生成 → 扩散 → 凝固 → 淡出 → 回收
```

---

## 4. 交互实现

### 鼠标事件映射
| 事件 | 响应函数 | 效果 |
|------|----------|------|
| mousemove | handleMove() | 生成墨点 |
| click | handleClick() | 切换季节 |
| dblclick | handleDoubleClick() | 重置画面 |
| mouseenter | showCursorHint() | 显示提示 |
| mouseleave | hideCursorHint() | 隐藏提示 |

### 触摸事件映射
| 事件 | 响应函数 |
|------|----------|
| touchstart | handleTouchStart() |
| touchmove | handleTouchMove() |
| touchend | handleSeasonSwitch() |

---

## 5. 视觉效果参数

### 四季墨效参数
```javascript
const SEASON_THEMES = {
  spring: {
    dotColor: '#ffb7c5',
    spreadSpeed: 1.2,
    shape: 'petal',        // 花瓣形
    wetness: 0.8
  },
  summer: {
    dotColor: '#2d5a27',
    spreadSpeed: 0.8,
    shape: 'leaf',         // 荷叶形
    wetness: 1.0
  },
  autumn: {
    dotColor: '#c41e3a',
    spreadSpeed: 0.6,
    shape: 'maple',        // 枫叶形
    wetness: 0.5
  },
  winter: {
    dotColor: '#e8e8e8',
    spreadSpeed: 0.3,
    shape: 'snow',         // 雪花形
    wetness: 0.2
  }
};
```

### 墨点物理参数
```javascript
const INK_PHYSICS = {
  maxDots: 500,
  baseSize: 8,
  sizeVariance: 4,
  spreadRate: 0.15,
  fadeRate: 0.002,
  maxAge: 10000           // 10秒
};
```

---

## 6. 性能优化策略

### 离屏渲染
- 使用离屏 Canvas 预渲染静态纹理
- 避免每帧重复绘制宣纸背景

### 对象池
- 预分配 100 个 InkDot 对象
- 回收机制复用已销毁对象

### 批量绘制
- 相同季节的墨点批量处理
- 减少 Canvas 状态切换

### 帧率控制
```javascript
const FRAME_RATE = {
  target: 60,
  threshold: 30,          // 低于此帧率启用降级
  skipFrames: 2           // 降级时跳帧数
};
```

---

## 7. 质量验收标准

### 功能验收
- [ ] 鼠标移动可生成墨点
- [ ] 四季可正确切换
- [ ] 双击清空画布
- [ ] 季节过渡动画流畅
- [ ] 移动端触摸交互正常

### 性能验收
- [ ] 桌面端 60fps 稳定
- [ ] 500 墨点时无卡顿
- [ ] 内存占用不超过 100MB

### 视觉验收
- [ ] 宣纸纹理清晰
- [ ] 墨点五色层次分明
- [ ] 季节配色准确
- [ ] 留白效果自然

### 兼容性验收
- [ ] Chrome/Edge/Firefox/Safari 正常
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
