# MirrorCanvas (镜像画板) - Technical Implementation

## 1. Project Overview

### Project Information
- **Project Name**: MirrorCanvas
- **Project Type**: Interactive Mirror Drawing Tool
- **Core Feature**: Symmetry-based drawing with multiple mirror modes
- **目标用户**: 艺术爱好者、教育课堂、创意工作者

### 技术栈
- **渲染引擎**: HTML5 Canvas 2D Context
- **数学计算**: 原生 JavaScript 数学库
- **动画系统**: requestAnimationFrame
- **构建工具**: 原生 HTML/CSS/JavaScript

---

## 2. 技术架构

### Module Structure
```
MirrorCanvas/
├── index.html              # Main entry
├── src/
│   └── app.js              # Application logic
│   ├── colorPicker.js      # 颜色选择器
│   └── utils.js            # 工具函数
├── assets/
│   └── icons/              # 图标资源
└── docs/
    ├── SPEC.md             # 规格说明书
    └── IMPLEMENTATION.md   # 本文档
```

### 核心类设计

#### SymmetryCanvas (对称画布)
```javascript
class SymmetryCanvas {
  constructor(canvas, symmetryType)
  symmetryType              // 对称类型
  symmetryAxes              // 对称轴数量
  drawPoint(x, y, color, size) // 绘制点（含镜像）
  clear()                   // 清空画布
  export()                  // 导出图片
}
```

#### SymmetryEngine (对称计算引擎)
```javascript
class SymmetryEngine {
  constructor(type)
  type                      // 对称类型
  getSymmetryPoints(x, y)   // 获取所有对称点
  setSymmetryType(type)     // 设置对称类型
}
```

#### BrushTool (画笔工具)
```javascript
class BrushTool {
  constructor(canvas)
  color                     // 当前颜色
  size                      // 当前粗细
  isDrawing                 // 是否绘制中
  startDrawing(x, y)        // 开始绘制
  draw(x, y)                // 绘制
  stopDrawing()             // 停止绘制
}
```

---

## 3. 渲染管线

### 绘制流程
```
1. 监听鼠标/触摸事件
2. 计算当前绘制点
3. 通过对称引擎计算所有镜像点
4. 在所有对称位置绘制
5. 实时更新画布
```

### 对称点计算算法

#### 镜像对称
```javascript
function getMirrorPoints(x, y, cx, cy) {
  return [
    {x: x, y: y},
    {x: 2 * cx - x, y: y}  // 水平镜像
  ];
}
```

#### 四方对称
```javascript
function getFourFoldPoints(x, y, cx, cy) {
  const dx = x - cx, dy = y - cy;
  return [
    {x: cx + dx, y: cy + dy},
    {x: cx - dx, y: cy + dy},
    {x: cx + dx, y: cy - dy},
    {x: cx - dx, y: cy - dy}
  ];
}
```

#### 旋转对称
```javascript
function getRotationalPoints(x, y, cx, cy, fold) {
  const dx = x - cx, dy = y - cy;
  const points = [];
  const angleStep = (2 * Math.PI) / fold;
  for (let i = 0; i < fold; i++) {
    const angle = i * angleStep;
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
    points.push({x: cx + rx, y: cy + ry});
  }
  return points;
}
```

---

## 4. 交互实现

### 鼠标事件映射
| 事件 | 响应函数 | 效果 |
|------|----------|------|
| mousedown | startDrawing() | 开始绘制 |
| mousemove | draw() | 继续绘制 |
| mouseup | stopDrawing() | 停止绘制 |
| mouseleave | stopDrawing() | 停止绘制 |

### 触摸事件映射
| 事件 | 响应函数 |
|------|----------|
| touchstart | handleTouchStart() |
| touchmove | handleTouchMove() |
| touchend | handleTouchEnd() |

---

## 5. 视觉效果参数

### 对称模式配置
```javascript
const SYMMETRY_MODES = {
  mirror: { axes: 1, name: '镜像对称' },
  fourFold: { axes: 2, name: '四方对称' },
  sixFold: { axes: 6, name: '六角对称' },
  eightFold: { axes: 8, name: '八边对称' }
};
```

### 画笔参数
```javascript
const BRUSH_CONFIG = {
  minSize: 1,
  maxSize: 20,
  defaultSize: 4,
  smoothing: 0.3           // 线条平滑系数
};
```

### 颜色预设
```javascript
const COLOR_PRESETS = [
  '#4a148c',  // 深紫
  '#ffd54f',  // 金黄
  '#00897b',  // 青绿
  '#f06292',  // 粉红
  '#1a237e',  // 深蓝
  '#ffffff',  // 白色
  '#ff5722',  // 橙红
  '#4caf50'   // 绿色
];
```

---

## 6. 性能优化策略

### 离屏渲染
- 使用离屏 Canvas 缓存绘制内容
- 只在需要时合成到主画布

### 线条平滑
- 使用贝塞尔曲线插值
- 减少锯齿

### 事件节流
- 限制绘制事件频率
- 使用 requestAnimationFrame 同步

---

## 7. 质量验收标准

### 功能验收
- [ ] 对称绘制正确
- [ ] 对称模式切换正常
- [ ] 颜色选择正常
- [ ] 画笔粗细调节正常
- [ ] 清除和保存功能正常
- [ ] 移动端触摸绘制正常

### 性能验收
- [ ] 桌面端 60fps 稳定
- [ ] 绘制无延迟
- [ ] 导出图片正确

### 视觉验收
- [ ] 对称效果准确
- [ ] 线条平滑
- [ ] 颜色显示正确
- [ ] UI 布局合理

### 兼容性验收
- [ ] Chrome/Edge/Firefox/Safari 正常
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
