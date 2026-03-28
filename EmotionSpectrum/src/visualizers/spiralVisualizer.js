class SpiralVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.time = 0;
        this.spiralArms = 6;
        this.particles = [];
        this.maxParticles = 300;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    emit(audioAnalyzer, emotionEngine) {
        const volume = audioAnalyzer.getVolume();
        const visualParams = emotionEngine.getVisualParameters();
        
        if (volume < 0.02) return;
        
        const emitCount = Math.floor(volume * 15);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < emitCount; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const arm = Math.floor(Math.random() * this.spiralArms);
            const baseAngle = (arm / this.spiralArms) * Math.PI * 2;
            const angleOffset = Utils.randomRange(-0.2, 0.2);
            
            const particle = {
                angle: baseAngle + angleOffset,
                radius: Utils.randomRange(10, 30),
                targetRadius: Utils.randomRange(100, Math.min(this.canvas.width, this.canvas.height) * 0.4),
                radiusSpeed: Utils.randomRange(0.5, 2) * visualParams.particleSpeed,
                angleSpeed: Utils.randomRange(0.01, 0.03) * (Math.random() > 0.5 ? 1 : -1),
                size: Utils.randomRange(2, 5) * (0.5 + volume),
                life: 1,
                decay: Utils.randomRange(0.003, 0.01),
                color: { ...visualParams.color },
                arm: arm,
                wobble: Utils.randomRange(0, Math.PI * 2),
                wobbleAmp: Utils.randomRange(5, 15)
            };
            
            this.particles.push(particle);
        }
    }
    
    update(audioAnalyzer, emotionEngine, deltaTime) {
        this.time += deltaTime * 0.001;
        
        const visualParams = emotionEngine.getVisualParameters();
        const bands = audioAnalyzer.getFrequencyBands();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.radius += p.radiusSpeed * visualParams.particleSpeed;
            p.angle += p.angleSpeed * visualParams.particleSpeed;
            
            p.wobble += 0.1;
            
            p.life -= p.decay;
            
            if (p.life <= 0 || p.radius > p.targetRadius) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(audioAnalyzer, emotionEngine, deltaTime) {
        const { ctx, canvas } = this;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
        ctx.fillRect(0, 0, width, height);
        
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        const bands = audioAnalyzer.getFrequencyBands();
        const frequencyData = audioAnalyzer.getFrequencyData();
        
        this.emit(audioAnalyzer, emotionEngine);
        this.update(audioAnalyzer, emotionEngine, deltaTime);
        
        this.renderSpiralArms(ctx, centerX, centerY, visualParams, volume, bands);
        this.renderParticles(ctx, centerX, centerY, visualParams);
        this.renderFrequencySpiral(ctx, centerX, centerY, frequencyData, visualParams, volume);
        this.renderCenterCore(ctx, centerX, centerY, visualParams, volume);
        this.renderOuterGlow(ctx, centerX, centerY, visualParams, volume);
    }
    
    renderSpiralArms(ctx, centerX, centerY, visualParams, volume, bands) {
        const { h, s, l } = visualParams.color;
        
        for (let arm = 0; arm < this.spiralArms; arm++) {
            const baseAngle = (arm / this.spiralArms) * Math.PI * 2 + this.time * 0.2;
            
            ctx.beginPath();
            
            for (let r = 30; r < Math.min(centerX, centerY) * 0.8; r += 2) {
                const angle = baseAngle + (r * 0.01);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                
                if (r === 30) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            const armHue = (h + arm * 30) % 360;
            const gradient = ctx.createLinearGradient(centerX, centerY, centerX + centerX * 0.8, centerY);
            gradient.addColorStop(0, `hsla(${armHue}, ${s}%, ${l}%, ${0.1 + volume * 0.2})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + volume * 2;
            ctx.stroke();
        }
    }
    
    renderParticles(ctx, centerX, centerY, visualParams) {
        for (const p of this.particles) {
            const wobbleX = Math.cos(p.wobble) * p.wobbleAmp;
            const wobbleY = Math.sin(p.wobble) * p.wobbleAmp;
            
            const x = centerX + Math.cos(p.angle) * p.radius + wobbleX;
            const y = centerY + Math.sin(p.angle) * p.radius + wobbleY;
            
            const { h, s, l } = p.color;
            const alpha = p.life * 0.8;
            
            ctx.save();
            ctx.translate(x, y);
            
            ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.shadowBlur = visualParams.glow * p.life;
            
            ctx.beginPath();
            ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 0, p.size * p.life * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(l + 30, 90)}%, ${alpha})`;
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    renderFrequencySpiral(ctx, centerX, centerY, frequencyData, visualParams, volume) {
        if (!frequencyData) return;
        
        const { h, s, l } = visualParams.color;
        const maxRadius = Math.min(centerX, centerY) * 0.9;
        const segments = Math.min(frequencyData.length, 180);
        
        ctx.beginPath();
        
        for (let i = 0; i < segments; i++) {
            const freqValue = frequencyData[Math.floor(i / segments * frequencyData.length)] / 255;
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2 + this.time * 0.3;
            const radius = 50 + freqValue * maxRadius * volume;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, maxRadius);
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.3})`);
        gradient.addColorStop(0.5, `hsla(${(h + 60) % 360}, ${s}%, ${l}%, ${volume * 0.2})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `hsla(${h}, ${s}%, ${l + 20}%, ${volume * 0.5})`;
        ctx.lineWidth = 1 + volume;
        ctx.stroke();
    }
    
    renderCenterCore(ctx, centerX, centerY, visualParams, volume) {
        const { h, s, l } = visualParams.color;
        const coreRadius = 20 + volume * 40;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${Math.min(l + 40, 95)}%, ${0.8 + volume * 0.2})`);
        gradient.addColorStop(0.3, `hsla(${h}, ${s}%, ${l}%, ${0.5 + volume * 0.3})`);
        gradient.addColorStop(0.7, `hsla(${h}, ${s}%, ${l * 0.7}%, ${0.2 + volume * 0.2})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, 1)`;
        ctx.shadowBlur = visualParams.glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(l + 50, 100)}%, 1)`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    renderOuterGlow(ctx, centerX, centerY, visualParams, volume) {
        const { h, s, l } = visualParams.color;
        const glowRadius = Math.min(centerX, centerY) * (0.6 + volume * 0.3);
        
        const gradient = ctx.createRadialGradient(centerX, centerY, glowRadius * 0.5, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.1})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    clear() {
        this.particles = [];
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
