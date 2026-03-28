/**
 * 工具函数库
 * 提供数学计算、颜色处理等通用功能
 */
const Utils = {
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
     * 线性插值
     * @param {number} a - 起始值
     * @param {number} b - 结束值
     * @param {number} t - 插值因子 (0-1)
     * @returns {number} 插值结果
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
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
     * RGBA颜色字符串生成
     * @param {number} r - 红色分量 (0-255)
     * @param {number} g - 绿色分量 (0-255)
     * @param {number} b - 蓝色分量 (0-255)
     * @param {number} a - 透明度 (0-1)
     * @returns {string} RGBA颜色字符串
     */
    rgba(r, g, b, a) {
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
    },
    
    /**
     * Hex转RGBA颜色字符串
     * @param {string} hex - Hex颜色值 (如 #1a1a1a)
     * @param {number} alpha - 透明度 (0-1)
     * @returns {string} RGBA颜色字符串
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    /**
     * HSL转RGB颜色
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @returns {{r: number, g: number, b: number}} RGB颜色对象
     */
    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return {
            r: Math.round(f(0) * 255),
            g: Math.round(f(8) * 255),
            b: Math.round(f(4) * 255)
        };
    },
    
    /**
     * 颜色混合
     * @param {string} color1 - 第一个颜色 (hex格式)
     * @param {string} color2 - 第二个颜色 (hex格式)
     * @param {number} ratio - 混合比例 (0-1)
     * @returns {string} 混合后的颜色 (hex格式)
     */
    blendColors(color1, color2, ratio) {
        const hex = (c) => parseInt(c.slice(1), 16);
        const r1 = (hex(color1) >> 16) & 255;
        const g1 = (hex(color1) >> 8) & 255;
        const b1 = hex(color1) & 255;
        const r2 = (hex(color2) >> 16) & 255;
        const g2 = (hex(color2) >> 8) & 255;
        const b2 = hex(color2) & 255;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
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
     * Perlin噪声（简化版）
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {number} 噪声值
     */
    perlinNoise(x, y) {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const u = x - i;
        const v = y - j;
        
        const a = this.noise2D(i, j);
        const b = this.noise2D(i + 1, j);
        const c = this.noise2D(i, j + 1);
        const d = this.noise2D(i + 1, j + 1);
        
        const smoothU = u * u * (3 - 2 * u);
        const smoothV = v * v * (3 - 2 * v);
        
        return this.lerp(
            this.lerp(a, b, smoothU),
            this.lerp(c, d, smoothU),
            smoothV
        );
    },
    
    /**
     * 缓动函数 - 缓出三次方
     * @param {number} t - 进度 (0-1)
     * @returns {number} 缓动后的值
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    /**
     * 缓动函数 - 缓入缓出二次方
     * @param {number} t - 进度 (0-1)
     * @returns {number} 缓动后的值
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
};
