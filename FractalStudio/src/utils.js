/**
 * 工具函数库
 * 提供数学计算、颜色转换等通用功能
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
     * 值域映射
     * @param {number} value - 输入值
     * @param {number} inMin - 输入最小值
     * @param {number} inMax - 输入最大值
     * @param {number} outMin - 输出最小值
     * @param {number} outMax - 输出最大值
     * @returns {number} 映射后的值
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        const divisor = inMax - inMin;
        if (divisor === 0) return outMin;
        return outMin + (outMax - outMin) * ((value - inMin) / divisor);
    },
    
    /**
     * HSL转RGB颜色
     * @param {number} h - 色相 (0-1)
     * @param {number} s - 饱和度 (0-1)
     * @param {number} l - 亮度 (0-1)
     * @returns {{r: number, g: number, b: number}} RGB颜色对象
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },
    
    /**
     * 平滑着色算法
     * 用于分形渲染中产生平滑的颜色过渡
     * @param {number} t - 迭代次数
     * @param {number} iterations - 最终迭代值的模方
     * @returns {number} 平滑后的迭代值
     */
    smoothColor(t, iterations) {
        const absIter = Math.max(1, Math.abs(iterations));
        const logValue = Math.log(absIter);
        if (!isFinite(logValue) || logValue <= 0) {
            return t;
        }
        return t + 1 - Math.log(logValue) / Math.log(2);
    }
};
