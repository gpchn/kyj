class ParticleVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 500;
        this.time = 0;
        
        this.emissionQueue = [];
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    emit(audioAnalyzer, emotionEngine) {
        const volume = audioAnalyzer.getVolume();
        const bands = audioAnalyzer.getFrequencyBands();
        const visualParams = emotionEngine.getVisualParameters();
        const emotionData = emotionEngine.getCurrentEmotion();
        
        if (volume < 0.02) return;
        
        const emitCount = Math.floor(volume * 20);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < emitCount; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 + volume * 3) * visualParams.particleSpeed;
            const band = this.selectBand(bands);
            
            const particle = {
                x: centerX + Utils.randomRange(-50, 50),
                y: centerY + Utils.randomRange(-50, 50),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomRange(2, 6) * (0.5 + volume),
                life: 1,
                decay: Utils.randomRange(0.005, 0.02),
                color: this.getParticleColor(visualParams.color, band, volume),
                band: band,
                trail: [],
                maxTrail: Math.floor(5 + volume * 10),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Utils.randomRange(-0.1, 0.1),
                wobble: Utils.randomRange(0, Math.PI * 2),
                wobbleSpeed: Utils.randomRange(0.05, 0.15)
            };
            
            this.particles.push(particle);
        }
    }
    
    selectBand(bands) {
        const total = Object.values(bands).reduce((a, b) => a + b, 0);
        if (total === 0) return 'mid';
        
        let random = Math.random() * total;
        for (const [band, value] of Object.entries(bands)) {
            random -= value;
            if (random <= 0) return band;
        }
        return 'mid';
    }
    
    getParticleColor(baseColor, band, volume) {
        const bandHueOffsets = {
            bass: 0,
            lowMid: 30,
            mid: 60,
            highMid: 90,
            treble: 120
        };
        
        const offset = bandHueOffsets[band] || 0;
        return {
            h: (baseColor.h + offset) % 360,
            s: baseColor.s + volume * 20,
            l: baseColor.l + Utils.randomRange(-10, 10)
        };
    }
    
    update(audioAnalyzer, emotionEngine, deltaTime) {
        this.time += deltaTime * 0.001;
        
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        const bands = audioAnalyzer.getFrequencyBands();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.trail.unshift({ x: p.x, y: p.y, size: p.size, life: p.life });
            if (p.trail.length > p.maxTrail) {
                p.trail.pop();
            }
            
            const bandValue = bands[p.band] || 0;
            const speedMod = 1 + bandValue * 0.5;
            
            p.wobble += p.wobbleSpeed;
            const wobbleForce = Math.sin(p.wobble) * 0.5;
            
            p.vx += wobbleForce * Math.cos(p.wobble);
            p.vy += wobbleForce * Math.sin(p.wobble);
            
            p.x += p.vx * speedMod * visualParams.particleSpeed;
            p.y += p.vy * speedMod * visualParams.particleSpeed;
            
            p.rotation += p.rotationSpeed;
            
            p.life -= p.decay;
            
            p.vx *= 0.99;
            p.vy *= 0.99;
            
            if (p.life <= 0 || 
                p.x < -50 || p.x > this.canvas.width + 50 ||
                p.y < -50 || p.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(audioAnalyzer, emotionEngine, deltaTime) {
        const { ctx, canvas } = this;
        
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        
        this.emit(audioAnalyzer, emotionEngine);
        this.update(audioAnalyzer, emotionEngine, deltaTime);
        
        this.renderTrails(ctx, visualParams);
        this.renderParticles(ctx, visualParams, volume);
        this.renderConnections(ctx, visualParams);
        this.renderCenterGlow(ctx, visualParams, volume);
    }
    
    renderTrails(ctx, visualParams) {
        for (const p of this.particles) {
            if (p.trail.length < 2) continue;
            
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            
            for (let i = 1; i < p.trail.length; i++) {
                const t = p.trail[i];
                ctx.lineTo(t.x, t.y);
            }
            
            const gradient = ctx.createLinearGradient(
                p.x, p.y,
                p.trail[p.trail.length - 1].x,
                p.trail[p.trail.length - 1].y
            );
            gradient.addColorStop(0, `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l}%, ${p.life * 0.5})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = p.size * 0.5;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
    
    renderParticles(ctx, visualParams, volume) {
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            const { h, s, l } = p.color;
            const alpha = p.life * (0.6 + volume * 0.4);
            
            ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.shadowBlur = visualParams.glow * p.life;
            
            ctx.beginPath();
            ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 0, p.size * p.life * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(l + 30, 90)}%, ${alpha * 0.8})`;
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    renderConnections(ctx, visualParams) {
        const connectionDistance = 100;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dist = Utils.distance(p1.x, p1.y, p2.x, p2.y);
                
                if (dist < connectionDistance) {
                    const opacity = (1 - dist / connectionDistance) * Math.min(p1.life, p2.life) * 0.3;
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `hsla(${(p1.color.h + p2.color.h) / 2}, ${visualParams.color.s}%, ${visualParams.color.l}%, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }
    
    renderCenterGlow(ctx, visualParams, volume) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const { h, s, l } = visualParams.color;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150 + volume * 100);
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.4})`);
        gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${volume * 0.15})`);
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
