const Utils = {
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    },
    
    hslToRgba(h, s, l, a) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return `rgba(${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)}, ${a})`;
    },
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    },
    
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },
    
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
    
    perlinNoise(x, y, t) {
        const nx = x + t * 0.5;
        const ny = y + t * 0.3;
        return (
            this.smoothNoise(nx * 0.01, ny * 0.01) * 0.5 +
            this.smoothNoise(nx * 0.02, ny * 0.02) * 0.25 +
            this.smoothNoise(nx * 0.04, ny * 0.04) * 0.125
        );
    },
    
    createGradient(ctx, x1, y1, x2, y2, colors) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    },
    
    createRadialGradient(ctx, x, y, r1, r2, colors) {
        const gradient = ctx.createRadialGradient(x, y, r1, x, y, r2);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    },
    
    polarToCartesian(cx, cy, radius, angle) {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    },
    
    cartesianToPolar(x, y, cx, cy) {
        return {
            radius: Math.sqrt((x - cx) ** 2 + (y - cy) ** 2),
            angle: Math.atan2(y - cy, x - cx)
        };
    }
};

const EMOTION_COLORS = {
    calm: { h: 200, s: 50, l: 60 },
    happy: { h: 45, s: 80, l: 65 },
    excited: { h: 340, s: 75, l: 60 },
    sad: { h: 220, s: 40, l: 45 },
    angry: { h: 0, s: 70, l: 50 },
    fearful: { h: 280, s: 50, l: 50 },
    neutral: { h: 180, s: 30, l: 60 }
};

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
