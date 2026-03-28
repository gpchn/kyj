# FractalStudio (分形绘制器) - Technical Implementation

## 1. Project Overview

### Project Information
- **Project Name**: FractalStudio
- **Project Type**: Interactive Fractal Generator
- **Core Feature**: Mandelbrot/Julia set fractal rendering with real-time interaction
- **目标用户**: 艺术展览、教育课堂、冥想体验

### 技术栈
- **渲染引擎**: HTML5 Canvas 2D Context
- **路径解析**: SVG Path API
- **动画系统**: requestAnimationFrame
- **构建工具**: 原生 HTML/CSS/JavaScript

---

## 2. 技术架构

### Module Structure
```
FractalStudio/
├── index.html              # Main entry
├── src/
│   ├── main.js             # Application entry
│   ├── fractalEngine.js    # Fractal rendering engine
│   ├── colorSchemes.js     # Color scheme definitions
│   └── utils.js            # Utility functions
│   └── utils.js            # 工具函数
├── assets/
│   └── shapes/             # 形态数据目录
│       ├── heart.svg       # 心脏形态
│       ├── flower.svg      # 花朵形态
│       └── constellation.svg # 星座形态
└── docs/
    ├── SPEC.md             # 规格说明书
    └── IMPLEMENTATION.md   # 本文档
```

### 核心类设计

#### Line (线条类)
```javascript
class Line {
  constructor(startPoint, endPoint)
  points[]                  // 路径点数组
  progress                  // 生长进度 0-1
  color                     // 线条颜色
  thickness                 // 线条粗细
  grow(deltaTime)           // 生长动画
  render(ctx)               // 绘制线条
  isComplete()              // 判断是否完成
}
```

#### GrowthEngine (生长引擎)
```javascript
class GrowthEngine {
  constructor()
  lines[]                   // 线条数组
  targetPoints[]            // 目标点数组
  growthSpeed               // 生长速度
  startGrowth(origin)       // 开始生长
  update(deltaTime)         // 更新生长状态
  render()                  // 渲染所有线条
}
```

#### ShapeTemplate (形态模板)
```javascript
class ShapeTemplate {
  constructor(name, svgPath)
  name                      // 形态名称
  pathData                  // SVG 路径数据
  guidePoints[]             // 引导点数组
  parsePath()               // 解析 SVG 路径
  getGuidePoints()          // 获取引导点
}
```

---

## 3. 渲染管线

### 绘制流程
```
1. 清除画布
2. 绘制背景网格(可选)
3. 更新所有线条生长状态
4. 按生长进度绘制线条
5. 绘制生长点光晕
6. 渲染 UI 组件
```

### 线条生长算法
```javascript
function growLine(line, targetPoint, deltaTime) {
  const currentEnd = line.getCurrentEnd();
  const direction = normalize(subtract(targetPoint, currentEnd));
  const growthAmount = line.growthSpeed * deltaTime;
  const newEnd = add(currentEnd, multiply(direction, growthAmount));
  line.addPoint(newEnd);
}
```

---

## 4. 交互实现

### 鼠标事件映射
| 事件 | 响应函数 | 效果 |
|------|----------|------|
| click | handleClick() | 开始生长 |
| mousemove | handleMove() | 自由模式引导 |
| dblclick | handleDoubleClick() | 重置画布 |
| keydown(space) | togglePause() | 暂停/继续 |

### 触摸事件映射
| 事件 | 响应函数 |
|------|----------|
| touchstart | handleTouchStart() |
| touchmove | handleTouchMove() |

---

## 5. 形态数据格式

### SVG 路径解析
```javascript
function parseSvgPath(pathString) {
  const commands = pathString.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g);
  const points = [];
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    // 转换为点坐标
  });
  return points;
}
```

### 引导点生成
```javascript
function generateGuidePoints(pathPoints, density) {
  const guidePoints = [];
  for (let i = 0; i < pathPoints.length - 1; i += density) {
    guidePoints.push(pathPoints[i]);
  }
  return guidePoints;
}
```

---

## 6. 视觉效果参数

### 线条参数
```javascript
const LINE_CONFIG = {
  baseThickness: 2,
  maxThickness: 4,
  minThickness: 1,
  growthSpeed: 50,          // px/s
  curveTension: 0.3         // 曲线张力
};
```

### 生长参数
```javascript
const GROWTH_CONFIG = {
  maxLines: 500,
  branchProbability: 0.1,   // 分支概率
  branchAngle: Math.PI / 6, // 分支角度
  attractionRadius: 100     // 吸引半径
};
```

### 莫兰迪色系
```javascript
const MORANDI_COLORS = [
  '#8b8589',  // 灰
  '#c4a7a7',  // 粉
  '#7a8b8b',  // 蓝
  '#8a9a8a',  // 绿
  '#c9b896'   // 黄
];
```

---

## 7. 性能优化策略

### 线条池
- 预分配线条对象
- 完成的线条不再更新

### 空间分区
- 使用四叉树管理线条
- 快速查找附近线条

### 渐进渲染
- 远处线条降低精度
- 使用 LOD (Level of Detail)

---

## 8. 质量验收标准

### 功能验收
- [ ] 点击可触发线条生长
- [ ] 形态模板正确加载
- [ ] 自由模式正常工作
- [ ] 暂停/重置功能正常
- [ ] 移动端触摸正常

### 性能验收
- [ ] 桌面端 60fps 稳定
- [ ] 500 线条时无卡顿
- [ ] 生长动画流畅

### 视觉验收
- [ ] 线条曲线平滑
- [ ] 莫兰迪配色准确
- [ ] 生长效果自然
- [ ] 形态可识别

### 兼容性验收
- [ ] Chrome/Edge/Firefox/Safari 正常
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
