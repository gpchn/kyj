/**
 * 工具函数库
 * 提供数学计算、颜色转换、噪声生成等通用功能
 */
const Utils = {
    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值因子 (0-1)
     * @returns {number} 插值结果
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    /**
     * 数值约束
     * @param {number} value - 输入值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 约束后的值
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    /**
     * 随机范围
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机值
     */
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * 计算两点间距离
     * @param {number} x1 - 第一个点的x坐标
     * @param {number} y1 - 第一个点的y坐标
     * @param {number} x2 - 第二个点的x坐标
     * @param {number} y2 - 第二个点的y坐标
     * @returns {number} 欧几里得距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    /**
     * 值域映射
     * @param {number} value - 输入值
     * @param {number} inMin - 输入最小值
     * @param {number} inMax - 输入最大值
     * @param {number} outMin - 输出最小值
     * @param {number} outMax - 输出最大值
     * @returns {number} 映射后的值
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    },
    
    /**
     * HSL转RGBA颜色字符串
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @param {number} a - 透明度 (0-1)
     * @returns {string} RGBA颜色字符串
     */
    hslToRgba(h, s, l, a) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return `rgba(${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)}, ${a})`;
    },
    
    /**
     * 缓出三次方缓动
     * @param {number} t - 进度 (0-1)
     * @returns {number} 缓动后的值
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    /**
     * 正弦缓入缓出
     * @param {number} t - 进度 (0-1)
     * @returns {number} 缓动后的值
     */
    easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    },
    
    /**
     * 2D伪随机噪声
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {number} 噪声值 (0-1)
     */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },
    
    /**
     * 平滑噪声采样
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} t - 时间因子
     * @returns {number} 平滑噪声值
     */
    smoothNoise(x, y, t) {
        const corners = (
            this.noise2D(Math.floor(x) - 1, Math.floor(y) - 1) +
            this.noise2D(Math.floor(x) + 1, Math.floor(y) - 1) +
            this.noise2D(Math.floor(x) - 1, Math.floor(y) + 1) +
            this.noise2D(Math.floor(x) + 1, Math.floor(y) + 1)
        ) / 16;
        const sides = (
            this.noise2D(Math.floor(x) - 1, Math.floor(y)) +
            this.noise2D(Math.floor(x) + 1, Math.floor(y)) +
            this.noise2D(Math.floor(x), Math.floor(y) - 1) +
            this.noise2D(Math.floor(x), Math.floor(y) + 1)
        ) / 8;
        const center = this.noise2D(Math.floor(x), Math.floor(y)) / 4;
        return corners + sides + center;
    },
    
    /**
     * Perlin噪声（多倍频叠加）
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} t - 时间因子
     * @returns {number} Perlin噪声值
     */
    perlinNoise(x, y, t) {
        const nx = x + t * 0.5;
        const ny = y + t * 0.3;
        return (
            this.smoothNoise(nx * 0.01, ny * 0.01) * 0.5 +
            this.smoothNoise(nx * 0.02, ny * 0.02) * 0.25 +
            this.smoothNoise(nx * 0.04, ny * 0.04) * 0.125
        );
    },
    
    /**
     * 创建线性渐变
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x1 - 起点x
     * @param {number} y1 - 起点y
     * @param {number} x2 - 终点x
     * @param {number} y2 - 终点y
     * @param {string[]} colors - 颜色数组
     * @returns {CanvasGradient} 渐变对象
     */
    createGradient(ctx, x1, y1, x2, y2, colors) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    },
    
    /**
     * 创建径向渐变
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - 圆心x
     * @param {number} y - 圆心y
     * @param {number} r1 - 内半径
     * @param {number} r2 - 外半径
     * @param {string[]} colors - 颜色数组
     * @returns {CanvasGradient} 渐变对象
     */
    createRadialGradient(ctx, x, y, r1, r2, colors) {
        const gradient = ctx.createRadialGradient(x, y, r1, x, y, r2);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    },
    
    /**
     * 极坐标转笛卡尔坐标
     * @param {number} cx - 圆心x
     * @param {number} cy - 圆心y
     * @param {number} radius - 半径
     * @param {number} angle - 角度（弧度）
     * @returns {{x: number, y: number}} 笛卡尔坐标
     */
    polarToCartesian(cx, cy, radius, angle) {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    },
    
    /**
     * 笛卡尔坐标转极坐标
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} cx - 圆心x
     * @param {number} cy - 圆心y
     * @returns {{radius: number, angle: number}} 极坐标
     */
    cartesianToPolar(x, y, cx, cy) {
        return {
            radius: Math.sqrt((x - cx) ** 2 + (y - cy) ** 2),
            angle: Math.atan2(y - cy, x - cx)
        };
    }
};

/**
 * 情感颜色配置
 * 定义每种情感对应的HSL颜色值
 */
const EMOTION_COLORS = {
    calm: { h: 200, s: 50, l: 60 },
    happy: { h: 45, s: 80, l: 65 },
    excited: { h: 340, s: 75, l: 60 },
    sad: { h: 220, s: 40, l: 45 },
    angry: { h: 0, s: 70, l: 50 },
    fearful: { h: 280, s: 50, l: 50 },
    neutral: { h: 180, s: 30, l: 60 }
};

/**
 * 情感配置
 * 定义每种情感的名称、颜色和视觉参数
 */
const EMOTION_CONFIG = {
    calm: {
        name: '平静',
        nameEn: 'Calm',
        color: EMOTION_COLORS.calm,
        visualStyle: 'smooth',
        particleSpeed: 0.5,
        waveAmplitude: 0.3
    },
    happy: {
        name: '愉悦',
        nameEn: 'Happy',
        color: EMOTION_COLORS.happy,
        visualStyle: 'bouncy',
        particleSpeed: 1.2,
        waveAmplitude: 0.6
    },
    excited: {
        name: '激动',
        nameEn: 'Excited',
        color: EMOTION_COLORS.excited,
        visualStyle: 'explosive',
        particleSpeed: 2.0,
        waveAmplitude: 1.0
    },
    sad: {
        name: '忧伤',
        nameEn: 'Sad',
        color: EMOTION_COLORS.sad,
        visualStyle: 'slow',
        particleSpeed: 0.3,
        waveAmplitude: 0.2
    },
    angry: {
        name: '愤怒',
        nameEn: 'Angry',
        color: EMOTION_COLORS.angry,
        visualStyle: 'sharp',
        particleSpeed: 1.8,
        waveAmplitude: 0.8
    },
    fearful: {
        name: '恐惧',
        nameEn: 'Fearful',
        color: EMOTION_COLORS.fearful,
        visualStyle: 'chaotic',
        particleSpeed: 1.5,
        waveAmplitude: 0.7
    },
    neutral: {
        name: '中性',
        nameEn: 'Neutral',
        color: EMOTION_COLORS.neutral,
        visualStyle: 'balanced',
        particleSpeed: 0.8,
        waveAmplitude: 0.4
    }
};
