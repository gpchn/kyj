class WaveVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.waves = [];
        this.maxWaves = 8;
        this.time = 0;
        
        this.initWaves();
    }
    
    initWaves() {
        this.waves = [];
        const height = this.canvas.height || 600;
        for (let i = 0; i < this.maxWaves; i++) {
            this.waves.push({
                amplitude: Utils.randomRange(20, 50),
                frequency: Utils.randomRange(0.5, 2),
                phase: Utils.randomRange(0, Math.PI * 2),
                speed: Utils.randomRange(0.5, 1.5),
                yOffset: (height / (this.maxWaves + 1)) * (i + 1),
                opacity: Utils.randomRange(0.1, 0.4)
            });
        }
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.initWaves();
    }
    
    render(audioAnalyzer, emotionEngine, deltaTime) {
        const { ctx, canvas } = this;
        const width = canvas.width;
        const height = canvas.height;
        
        if (width <= 0 || height <= 0) return;
        
        this.time += deltaTime * 0.001;
        
        const emotionData = emotionEngine.getCurrentEmotion();
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        const frequencyData = audioAnalyzer.getFrequencyData();
        const bands = audioAnalyzer.getFrequencyBands();
        
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.renderMainWave(ctx, width, height, volume, visualParams, frequencyData);
        
        this.renderRippleWaves(ctx, centerX, centerY, volume, visualParams);
        
        this.renderFrequencyWaves(ctx, width, height, bands, visualParams);
        
        this.renderGlowEffect(ctx, centerX, centerY, volume, visualParams);
    }
    
    renderMainWave(ctx, width, height, volume, visualParams, frequencyData) {
        const { h, s, l } = visualParams.color;
        const amplitude = Math.max(1, visualParams.waveAmplitude * 100 * (0.5 + volume));
        
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        const segments = frequencyData ? Math.min(frequencyData.length, 256) : 128;
        
        for (let x = 0; x <= width; x += 2) {
            const index = Math.floor((x / width) * segments);
            let freqValue = 0;
            
            if (frequencyData && index < frequencyData.length) {
                freqValue = frequencyData[index] / 255;
            }
            
            const waveY = Math.sin((x * 0.01) + this.time * visualParams.particleSpeed) * amplitude * (0.5 + freqValue);
            
            const noiseY = Utils.perlinNoise(x, this.time * 50, this.time) * 30 * volume;
            
            const y = height / 2 + waveY + noiseY;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, height / 2 - amplitude, 0, height);
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${0.6 + volume * 0.3})`);
        gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l * 0.7}%, ${0.3 + volume * 0.2})`);
        gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l * 0.5}%, 0.1)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
            const index = Math.floor((x / width) * segments);
            let freqValue = 0;
            if (frequencyData && index < frequencyData.length) {
                freqValue = frequencyData[index] / 255;
            }
            
            const waveY = Math.sin((x * 0.01) + this.time * visualParams.particleSpeed) * amplitude * (0.5 + freqValue);
            const noiseY = Utils.perlinNoise(x, this.time * 50, this.time) * 30 * volume;
            const y = height / 2 + waveY + noiseY;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.strokeStyle = `hsla(${h}, ${s}%, ${l + 20}%, ${0.8 + volume * 0.2})`;
        ctx.lineWidth = Math.max(1, 2 + volume * 3);
        ctx.stroke();
        
        ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, 0.8)`;
        ctx.shadowBlur = Math.max(0, visualParams.glow);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    renderRippleWaves(ctx, centerX, centerY, volume, visualParams) {
        const { h, s, l } = visualParams.color;
        const numRipples = Math.max(1, Math.floor(3 + volume * 5));
        const maxRadius = Math.max(10, Math.min(centerX, centerY));
        
        for (let i = 0; i < numRipples; i++) {
            const phase = (this.time * 0.5 + i * 0.3) % 1;
            const radius = Math.max(1, phase * maxRadius * (0.5 + volume * 0.5));
            const opacity = Math.max(0, (1 - phase) * 0.3 * volume);
            
            if (radius > 0 && opacity > 0.001) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
                ctx.lineWidth = Math.max(0.5, 1 + volume * 2);
                ctx.stroke();
            }
        }
    }
    
    renderFrequencyWaves(ctx, width, height, bands, visualParams) {
        const { h, s, l } = visualParams.color;
        const bandNames = ['bass', 'lowMid', 'mid', 'highMid', 'treble'];
        const bandColors = [
            { h: h, s: s, l: l * 0.6 },
            { h: h + 30, s: s, l: l * 0.7 },
            { h: h + 60, s: s, l: l * 0.8 },
            { h: h + 90, s: s, l: l * 0.9 },
            { h: h + 120, s: s, l: l }
        ];
        
        bandNames.forEach((band, i) => {
            const value = bands[band] || 0;
            if (value < 0.05) return;
            
            const y = height * 0.2 + (i / bandNames.length) * height * 0.6;
            const amplitude = Math.max(1, value * 50);
            const color = bandColors[i];
            
            ctx.beginPath();
            for (let x = 0; x <= width; x += 3) {
                const waveY = Math.sin(x * 0.02 + this.time * (i + 1) * 0.5) * amplitude;
                const y2 = y + waveY;
                
                if (x === 0) {
                    ctx.moveTo(x, y2);
                } else {
                    ctx.lineTo(x, y2);
                }
            }
            
            ctx.strokeStyle = `hsla(${color.h % 360}, ${color.s}%, ${color.l}%, ${value * 0.5})`;
            ctx.lineWidth = Math.max(0.5, 1 + value * 2);
            ctx.stroke();
        });
    }
    
    renderGlowEffect(ctx, centerX, centerY, volume, visualParams) {
        const { h, s, l } = visualParams.color;
        const glowRadius = Math.max(10, 100 + volume * 200);
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.3})`);
        gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.1})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    clear() {
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
