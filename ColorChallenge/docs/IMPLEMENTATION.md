# ColorChallenge (色差挑战) - Technical Implementation

## 1. Project Overview

### Project Information
- **Project Name**: ColorChallenge
- **Project Type**: Educational Color Discrimination Game
- **Core Feature**: Find the color block with subtle difference
- **目标用户**: 艺术学习者、设计入门者、色彩爱好者

### 技术栈
- **渲染引擎**: HTML5 Canvas 2D + CSS
- **色轮组件**: SVG 绘制
- **动画系统**: CSS Animations + requestAnimationFrame
- **构建工具**: 原生 HTML/CSS/JavaScript

---

## 2. 技术架构

### Module Structure
```
ColorChallenge/
├── index.html              # Main entry
├── src/
│   └── game.js             # Game logic
│   └── utils.js            # 工具函数
├── assets/
│   └── levels/             # 关卡数据目录
│       ├── level-01.json   # 第1关数据
│       ├── level-02.json   # 第2关数据
│       └── ...             # 更多关卡
└── docs/
    ├── SPEC.md             # 规格说明书
    └── IMPLEMENTATION.md   # 本文档
```

### 核心类设计

#### GameController (游戏控制器)
```javascript
class GameController {
  constructor()
  currentLevel              // 当前关卡
  score                     // 当前得分
  state                     // 游戏状态
  loadLevel(id)             // 加载关卡
  submitColor(color)        // 提交颜色选择
  nextLevel()               // 下一关
  restart()                 // 重新开始
}
```

#### ColorWheel (色轮组件)
```javascript
class ColorWheel {
  constructor(container)
  selectedColor             // 当前选中颜色
  render()                  // 渲染色轮
  getColorAt(x, y)          // 获取指定位置颜色
  setSelected(color)        // 设置选中颜色
  onColorSelect(callback)   // 颜色选择回调
}
```

#### LevelManager (关卡管理器)
```javascript
class LevelManager {
  constructor()
  levels[]                  // 关卡数据数组
  unlockedLevels            // 已解锁关卡
  loadLevels()              // 加载所有关卡
  getLevel(id)              // 获取关卡数据
  unlockNext()              // 解锁下一关
}
```

---

## 3. 渲染管线

### 绘制流程
```
1. 清除画布
2. 绘制抽象画作背景
3. 绘制已填充色块
4. 绘制缺失区域（虚线边框）
5. 渲染色轮选择器
6. 绘制 UI 组件
```

### 色轮绘制算法
```javascript
function drawColorWheel(ctx, cx, cy, radius) {
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 1) * Math.PI / 180;
    const endAngle = (angle + 1) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
    ctx.fill();
  }
}
```

---

## 4. 交互实现

### 鼠标事件映射
| 事件 | 响应函数 | 效果 |
|------|----------|------|
| click (色轮) | selectColor() | 选择颜色 |
| click (确认) | submitColor() | 提交选择 |
| click (关卡) | jumpToLevel() | 跳转关卡 |

### 触摸事件映射
| 事件 | 响应函数 |
|------|----------|
| touchstart | handleTouchStart() |
| touchmove | handleTouchMove() |
| touchend | handleTouchEnd() |

---

## 5. 关卡数据格式

### JSON 结构
```json
{
  "id": 1,
  "title": "互补色入门",
  "description": "选择红色的互补色",
  "theory": "complementary",
  "painting": {
    "blocks": [
      {"x": 0, "y": 0, "width": 100, "height": 100, "color": "#ff0000"},
      {"x": 100, "y": 0, "width": 100, "height": 100, "color": "#0000ff"},
      {"x": 0, "y": 100, "width": 100, "height": 100, "color": "missing"}
    ]
  },
  "targetColor": "#00ff00",
  "tolerance": 30,
  "hints": ["互补色位于色轮对面"]
}
```

---

## 6. 视觉效果参数

### 评分参数
```javascript
const SCORING = {
  tolerance: {
    S: 10,                  // 色差 < 10
    A: 20,                  // 色差 < 20
    B: 30,                  // 色差 < 30
    C: 50                   // 色差 < 50
  },
  colorDiffMethod: 'CIEDE2000' // 色差计算方法
};
```

### 动画参数
```javascript
const ANIMATION = {
  fillDuration: 500,        // 填充动画时长(ms)
  scorePopupDuration: 300,  // 评分弹出时长(ms)
  starBurstCount: 8         // 星星爆发数量
};
```

---

## 7. 性能优化策略

### 关卡预加载
- 预加载相邻关卡数据
- 图片资源缓存

### 色轮缓存
- 色轮预渲染到离屏 Canvas
- 只在需要时更新

### 动画优化
- 使用 CSS 硬件加速
- 减少 DOM 操作

---

## 8. 质量验收标准

### 功能验收
- [ ] 色轮选择正常
- [ ] 关卡加载正确
- [ ] 评分计算准确
- [ ] 关卡解锁机制正常
- [ ] 移动端触摸正常

### 性能验收
- [ ] 桌面端 60fps 稳定
- [ ] 关卡加载 < 500ms
- [ ] 色轮响应即时

### 视觉验收
- [ ] 色轮颜色准确
- [ ] 动画流畅自然
- [ ] UI 布局合理
- [ ] 色盲模式可用

### 兼容性验收
- [ ] Chrome/Edge/Firefox/Safari 正常
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
