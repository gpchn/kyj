class KaleidoscopeVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.time = 0;
        this.segments = 12;
        this.shapes = [];
        this.maxShapes = 100;
        this.rotationOffset = 0;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    emit(audioAnalyzer, emotionEngine) {
        const volume = audioAnalyzer.getVolume();
        const bands = audioAnalyzer.getFrequencyBands();
        const visualParams = emotionEngine.getVisualParameters();
        
        if (volume < 0.02) return;
        
        const emitCount = Math.floor(volume * 8);
        
        for (let i = 0; i < emitCount; i++) {
            if (this.shapes.length >= this.maxShapes) break;
            
            const band = this.selectBand(bands);
            const shape = {
                type: this.selectShape(band),
                angle: Math.random() * Math.PI * 2,
                distance: Utils.randomRange(50, Math.min(this.canvas.width, this.canvas.height) * 0.35),
                size: Utils.randomRange(10, 30) * (0.5 + volume),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Utils.randomRange(-0.02, 0.02),
                life: 1,
                decay: Utils.randomRange(0.005, 0.015),
                color: { ...visualParams.color },
                band: band,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: Utils.randomRange(0.05, 0.15)
            };
            
            this.shapes.push(shape);
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
    
    selectShape(band) {
        const shapes = {
            bass: ['circle', 'hexagon'],
            lowMid: ['triangle', 'diamond'],
            mid: ['square', 'star'],
            highMid: ['pentagon', 'cross'],
            treble: ['ring', 'burst']
        };
        
        const options = shapes[band] || shapes.mid;
        return options[Math.floor(Math.random() * options.length)];
    }
    
    update(audioAnalyzer, emotionEngine, deltaTime) {
        this.time += deltaTime * 0.001;
        
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        
        this.rotationOffset += 0.002 * visualParams.particleSpeed;
        
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const s = this.shapes[i];
            
            s.rotation += s.rotationSpeed * visualParams.particleSpeed;
            s.pulsePhase += s.pulseSpeed;
            
            s.life -= s.decay;
            
            if (s.life <= 0) {
                this.shapes.splice(i, 1);
            }
        }
    }
    
    render(audioAnalyzer, emotionEngine, deltaTime) {
        const { ctx, canvas } = this;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, width, height);
        
        const visualParams = emotionEngine.getVisualParameters();
        const volume = audioAnalyzer.getVolume();
        const frequencyData = audioAnalyzer.getFrequencyData();
        const bands = audioAnalyzer.getFrequencyBands();
        
        this.emit(audioAnalyzer, emotionEngine);
        this.update(audioAnalyzer, emotionEngine, deltaTime);
        
        this.renderKaleidoscope(ctx, centerX, centerY, visualParams, volume, frequencyData);
        this.renderCenterMandala(ctx, centerX, centerY, visualParams, volume, bands);
        this.renderOuterRing(ctx, centerX, centerY, visualParams, volume, frequencyData);
    }
    
    renderKaleidoscope(ctx, centerX, centerY, visualParams, volume, frequencyData) {
        const segmentAngle = (Math.PI * 2) / this.segments;
        
        for (let seg = 0; seg < this.segments; seg++) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(seg * segmentAngle + this.rotationOffset);
            
            if (seg % 2 === 1) {
                ctx.scale(1, -1);
            }
            
            for (const shape of this.shapes) {
                this.renderShapeInSegment(ctx, shape, visualParams, volume, segmentAngle);
            }
            
            ctx.restore();
        }
    }
    
    renderShapeInSegment(ctx, shape, visualParams, volume, segmentAngle) {
        const pulse = 1 + Math.sin(shape.pulsePhase) * 0.2;
        const size = shape.size * shape.life * pulse;
        
        const x = Math.cos(shape.angle) * shape.distance;
        const y = Math.sin(shape.angle) * shape.distance;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(shape.rotation);
        
        const { h, s, l } = shape.color;
        const alpha = shape.life * (0.5 + volume * 0.3);
        
        ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
        ctx.shadowBlur = visualParams.glow * shape.life;
        
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.6})`;
        ctx.strokeStyle = `hsla(${h}, ${s}%, ${l + 20}%, ${alpha})`;
        ctx.lineWidth = 1 + volume;
        
        this.drawShape(ctx, shape.type, size);
        
        ctx.restore();
    }
    
    drawShape(ctx, type, size) {
        ctx.beginPath();
        
        switch (type) {
            case 'circle':
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                break;
                
            case 'triangle':
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'square':
                ctx.rect(-size, -size, size * 2, size * 2);
                break;
                
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'pentagon':
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
                    const r = i % 2 === 0 ? size : size * 0.5;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'diamond':
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.7, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.7, 0);
                ctx.closePath();
                break;
                
            case 'ring':
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.moveTo(size * 0.6, 0);
                ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2, true);
                break;
                
            case 'cross':
                const w = size * 0.3;
                ctx.moveTo(-w, -size);
                ctx.lineTo(w, -size);
                ctx.lineTo(w, -w);
                ctx.lineTo(size, -w);
                ctx.lineTo(size, w);
                ctx.lineTo(w, w);
                ctx.lineTo(w, size);
                ctx.lineTo(-w, size);
                ctx.lineTo(-w, w);
                ctx.lineTo(-size, w);
                ctx.lineTo(-size, -w);
                ctx.lineTo(-w, -w);
                ctx.closePath();
                break;
                
            case 'burst':
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const r = i % 2 === 0 ? size : size * 0.3;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            default:
                ctx.arc(0, 0, size, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.stroke();
    }
    
    renderCenterMandala(ctx, centerX, centerY, visualParams, volume, bands) {
        const { h, s, l } = visualParams.color;
        const layers = 5;
        
        for (let layer = 0; layer < layers; layer++) {
            const radius = 30 + layer * 25 + volume * 20;
            const petals = 8 + layer * 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(this.time * 0.1 * (layer % 2 === 0 ? 1 : -1));
            
            const layerHue = (h + layer * 20) % 360;
            
            for (let i = 0; i < petals; i++) {
                const angle = (i / petals) * Math.PI * 2;
                
                ctx.save();
                ctx.rotate(angle);
                ctx.translate(radius, 0);
                
                ctx.beginPath();
                ctx.ellipse(0, 0, 15 + volume * 10, 8 + volume * 5, 0, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${layerHue}, ${s}%, ${l}%, ${0.2 + volume * 0.1})`;
                ctx.fill();
                
                ctx.restore();
            }
            
            ctx.restore();
        }
        
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40 + volume * 30);
        coreGradient.addColorStop(0, `hsla(${h}, ${s}%, ${Math.min(l + 40, 95)}%, 0.9)`);
        coreGradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, 0.5)`);
        coreGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40 + volume * 30, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
    }
    
    renderOuterRing(ctx, centerX, centerY, visualParams, volume, frequencyData) {
        if (!frequencyData) return;
        
        const { h, s, l } = visualParams.color;
        const maxRadius = Math.min(centerX, centerY) * 0.95;
        const segments = Math.min(frequencyData.length, 72);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.time * 0.05);
        
        for (let i = 0; i < segments; i++) {
            const freqValue = frequencyData[Math.floor(i / segments * frequencyData.length)] / 255;
            const angle = (i / segments) * Math.PI * 2;
            const innerRadius = maxRadius * 0.85;
            const outerRadius = innerRadius + freqValue * maxRadius * 0.15 * volume;
            
            const x1 = Math.cos(angle) * innerRadius;
            const y1 = Math.sin(angle) * innerRadius;
            const x2 = Math.cos(angle) * outerRadius;
            const y2 = Math.sin(angle) * outerRadius;
            
            const segHue = (h + (i / segments) * 60) % 360;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsla(${segHue}, ${s}%, ${l}%, ${0.3 + freqValue * 0.5})`;
            ctx.lineWidth = 2 + freqValue * 3;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    clear() {
        this.shapes = [];
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
