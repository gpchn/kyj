class BrushEngine {
    constructor(canvas, seasonThemes) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.seasonThemes = seasonThemes;
        
        this.brushSize = 20;
        this.inkDensity = 70;
        this.wetness = 50;
        this.inkLevel = 100;
        
        this.isDrawing = false;
        this.lastPoint = null;
        this.strokePoints = [];
        
        this.inkParticles = [];
        this.strokeHistory = [];
        
        this.brushImage = null;
        this.brushLoaded = false;
        this.loadBrushImage();
        
        this.paperTexture = this.generatePaperTexture();
    }
    
    loadBrushImage() {
        this.brushImage = new Image();
        this.brushImage.crossOrigin = "anonymous";
        this.brushImage.onload = () => {
            this.brushLoaded = true;
            this.createBrushCanvas();
            console.log(`笔刷资源加载成功: ${this.brushImage.width}x${this.brushImage.height}`);
        };
        this.brushImage.onerror = () => {
            console.warn('笔刷资源加载失败，使用默认笔刷');
            this.brushLoaded = false;
            this.brushImage = null;
        };
        this.brushImage.src = 'assets/pen.png';
    }
    
    createBrushCanvas() {
        this.brushCanvas = document.createElement('canvas');
        this.brushCanvas.width = this.brushImage.width;
        this.brushCanvas.height = this.brushImage.height;
        this.brushCtx = this.brushCanvas.getContext('2d');
    }
    
    drawWithBrush(x, y, size, color, opacity, rotation) {
        if (!this.brushLoaded || !this.brushImage) {
            this.drawDefaultBrush(x, y, size, color, opacity);
            return;
        }
        
        this.ctx.save();
        
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        this.brushCtx.clearRect(0, 0, this.brushCanvas.width, this.brushCanvas.height);
        this.brushCtx.globalCompositeOperation = 'source-over';
        this.brushCtx.drawImage(this.brushImage, 0, 0);
        
        this.brushCtx.globalCompositeOperation = 'source-in';
        this.brushCtx.fillStyle = color;
        this.brushCtx.fillRect(0, 0, this.brushCanvas.width, this.brushCanvas.height);
        
        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(
            this.brushCanvas,
            -size / 2,
            -size / 2,
            size,
            size
        );
        
        this.ctx.restore();
    }
    
    drawDefaultBrush(x, y, size, color, opacity) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    generatePaperTexture() {
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 256;
        textureCanvas.height = 256;
        const textureCtx = textureCanvas.getContext('2d');
        
        textureCtx.fillStyle = '#f5f3ef';
        textureCtx.fillRect(0, 0, 256, 256);
        
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const alpha = Math.random() * 0.03;
            textureCtx.fillStyle = `rgba(139, 133, 137, ${alpha})`;
            textureCtx.fillRect(x, y, 1, 1);
        }
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const length = 5 + Math.random() * 15;
            const angle = Math.random() * Math.PI;
            
            textureCtx.strokeStyle = `rgba(139, 133, 137, ${Math.random() * 0.02})`;
            textureCtx.lineWidth = 0.5;
            textureCtx.beginPath();
            textureCtx.moveTo(x, y);
            textureCtx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            textureCtx.stroke();
        }
        
        return textureCanvas;
    }
    
    setBrushSize(size) {
        this.brushSize = size;
    }
    
    setInkDensity(density) {
        this.inkDensity = density;
    }
    
    setWetness(wetness) {
        this.wetness = wetness;
    }
    
    consumeInk(amount) {
        this.inkLevel = Math.max(0, this.inkLevel - amount);
        return this.inkLevel > 0;
    }
    
    refillInk() {
        this.inkLevel = 100;
    }
    
    startStroke(x, y) {
        if (this.inkLevel <= 0) return;
        
        this.isDrawing = true;
        this.lastPoint = { x, y };
        this.strokePoints = [{ x, y, time: Date.now(), pressure: 0.5 }];
        
        const brush = this.seasonThemes.getCurrentBrush();
        
        if (brush.name === '花卉' || brush.name === '叶片') {
            this.drawDecorativeElement(x, y);
        }
    }
    
    continueStroke(x, y) {
        if (!this.isDrawing || this.inkLevel <= 0) return;
        
        const now = Date.now();
        const lastTime = this.strokePoints[this.strokePoints.length - 1].time;
        const timeDelta = now - lastTime;
        
        const distance = Utils.distance(this.lastPoint.x, this.lastPoint.y, x, y);
        const speed = distance / Math.max(timeDelta, 1);
        const pressure = Math.max(0.2, Math.min(1, 1 - speed * 0.01));
        
        const currentPoint = { x, y, time: now, pressure };
        this.strokePoints.push(currentPoint);
        
        switch (this.seasonThemes.currentBrush) {
            case 'ink':
                this.drawInkStroke(this.lastPoint, currentPoint);
                break;
            case 'splash':
                this.drawSplashStroke(this.lastPoint, currentPoint);
                break;
            case 'flower':
                this.drawDecorativeElement(x, y);
                break;
            case 'leaf':
                this.drawDecorativeElement(x, y);
                break;
        }
        
        this.consumeInk(0.03 + pressure * 0.02);
        this.lastPoint = currentPoint;
        
        if (this.strokePoints.length > 100) {
            this.strokePoints.shift();
        }
    }
    
    endStroke() {
        if (this.strokePoints.length > 2) {
            this.strokeHistory.push([...this.strokePoints]);
            if (this.strokeHistory.length > 50) {
                this.strokeHistory.shift();
            }
        }
        
        this.isDrawing = false;
        this.lastPoint = null;
        this.strokePoints = [];
    }
    
    drawInkStroke(from, to) {
        const distance = Utils.distance(from.x, from.y, to.x, to.y);
        const steps = Math.max(1, Math.floor(distance / 3));
        
        const inkColor = this.seasonThemes.getInkColor(this.inkDensity);
        const baseOpacity = inkColor.opacity * (this.inkLevel / 100);
        
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Utils.lerp(from.x, to.x, t);
            const y = Utils.lerp(from.y, to.y, t);
            
            const pressure = Utils.lerp(from.pressure || 0.5, to.pressure || 0.5, t);
            const size = this.brushSize * pressure * (0.8 + Math.random() * 0.4);
            
            const wetSpread = this.wetness / 100;
            const opacity = baseOpacity * (0.6 + pressure * 0.4);
            
            const rotation = angle + (Math.random() - 0.5) * 0.3;
            
            this.drawWithBrush(x, y, size, inkColor.color, opacity, rotation);
            
            if (wetSpread > 0.3 && Math.random() > 0.6) {
                this.addInkBleed(x, y, size * 0.5, inkColor.color, opacity * 0.3);
            }
            
            if (this.inkDensity > 60 && Math.random() > 0.9) {
                this.addInkParticle(x, y, inkColor.color, opacity * 0.4);
            }
        }
        
        this.renderInkParticles();
    }
    
    addInkParticle(x, y, color, opacity) {
        this.inkParticles.push({
            x: x + (Math.random() - 0.5) * 5,
            y: y + (Math.random() - 0.5) * 5,
            size: Math.random() * 3 + 1,
            opacity: opacity,
            decay: 0.01 + Math.random() * 0.02,
            color: color
        });
        
        if (this.inkParticles.length > 200) {
            this.inkParticles.shift();
        }
    }
    
    renderInkParticles() {
        for (let i = this.inkParticles.length - 1; i >= 0; i--) {
            const p = this.inkParticles[i];
            
            this.ctx.fillStyle = Utils.hexToRgba(p.color, p.opacity);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            p.opacity -= p.decay;
            if (p.opacity <= 0) {
                this.inkParticles.splice(i, 1);
            }
        }
    }
    
    drawSplashStroke(from, to) {
        const distance = Utils.distance(from.x, from.y, to.x, to.y);
        const inkColor = this.seasonThemes.getInkColor(this.inkDensity);
        const baseOpacity = inkColor.opacity * (this.inkLevel / 100) * 0.7;
        
        const centerX = (from.x + to.x) / 2;
        const centerY = (from.y + to.y) / 2;
        const splashRadius = Math.max(5, this.brushSize * (1 + this.wetness / 100));
        
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, splashRadius * 2
        );
        gradient.addColorStop(0, Utils.hexToRgba(inkColor.color, baseOpacity * 0.9));
        gradient.addColorStop(0.2, Utils.hexToRgba(inkColor.color, baseOpacity * 0.6));
        gradient.addColorStop(0.5, Utils.hexToRgba(inkColor.color, baseOpacity * 0.3));
        gradient.addColorStop(0.8, Utils.hexToRgba(inkColor.color, baseOpacity * 0.1));
        gradient.addColorStop(1, Utils.hexToRgba(inkColor.color, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, splashRadius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        const splashCount = Math.floor(8 + this.wetness / 10);
        for (let i = 0; i < splashCount; i++) {
            const angle = (i / splashCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = splashRadius * (0.6 + Math.random() * 1);
            const px = centerX + Math.cos(angle) * dist;
            const py = centerY + Math.sin(angle) * dist;
            const pSize = Math.max(1, this.brushSize * 0.2 * Math.random());
            
            const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, pSize * 2);
            particleGradient.addColorStop(0, Utils.hexToRgba(inkColor.color, baseOpacity * 0.5));
            particleGradient.addColorStop(1, Utils.hexToRgba(inkColor.color, 0));
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawDryStroke(from, to) {
        const distance = Utils.distance(from.x, from.y, to.x, to.y);
        const steps = Math.max(1, Math.floor(distance / 2));
        const inkColor = this.seasonThemes.getInkColor(this.inkDensity);
        const baseOpacity = inkColor.opacity * (this.inkLevel / 100) * 0.9;
        
        this.ctx.save();
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Utils.lerp(from.x, to.x, t);
            const y = Utils.lerp(from.y, to.y, t);
            
            const pressure = Utils.lerp(from.pressure || 0.5, to.pressure || 0.5, t);
            
            if (Math.random() > 0.2) {
                const noise = Utils.perlinNoise(x * 0.1, y * 0.1) * 8;
                const offsetX = (Math.random() - 0.5) * 3 + noise;
                const offsetY = (Math.random() - 0.5) * 3;
                
                const strokeLength = Math.max(2, this.brushSize * 0.3 * pressure * (0.5 + Math.random()));
                const strokeAngle = Math.random() * Math.PI;
                
                this.ctx.globalAlpha = baseOpacity * (0.4 + Math.random() * 0.6);
                this.ctx.strokeStyle = inkColor.color;
                this.ctx.lineWidth = Math.max(0.5, 1 + Math.random() * 2);
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(x + offsetX, y + offsetY);
                this.ctx.lineTo(
                    x + offsetX + Math.cos(strokeAngle) * strokeLength,
                    y + offsetY + Math.sin(strokeAngle) * strokeLength
                );
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawBranchStroke(from, to) {
        const distance = Utils.distance(from.x, from.y, to.x, to.y);
        const branchColor = this.seasonThemes.getBranchColor();
        const baseOpacity = 0.85 * (this.inkLevel / 100);
        
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const pressure = (from.pressure + to.pressure) / 2 || 0.5;
        const mainWidth = Math.max(1, this.brushSize * 0.4 * pressure);
        
        this.ctx.strokeStyle = branchColor;
        this.ctx.globalAlpha = baseOpacity;
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        
        const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 15;
        const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 15;
        
        this.ctx.lineWidth = mainWidth;
        this.ctx.quadraticCurveTo(midX, midY, to.x, to.y);
        this.ctx.stroke();
        
        if (distance > 25 && Math.random() > 0.4) {
            const branchPoint = { x: midX, y: midY };
            const branchAngle = Math.atan2(to.y - from.y, to.x - from.x) + (Math.random() - 0.5) * Math.PI / 2;
            const branchLength = distance * 0.35 * (0.5 + Math.random() * 0.5);
            
            this.ctx.lineWidth = Math.max(1, mainWidth * 0.5);
            this.ctx.globalAlpha = baseOpacity * 0.7;
            
            this.ctx.beginPath();
            this.ctx.moveTo(branchPoint.x, branchPoint.y);
            this.ctx.lineTo(
                branchPoint.x + Math.cos(branchAngle) * branchLength,
                branchPoint.y + Math.sin(branchAngle) * branchLength
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawDecorativeElement(x, y) {
        const brush = this.seasonThemes.getCurrentBrush();
        
        if (brush.name === '花卉') {
            this.drawFlower(x, y);
        } else if (brush.name === '叶片') {
            this.drawLeaf(x, y);
        }
    }
    
    drawFlower(x, y) {
        const flowerColor = this.seasonThemes.getFlowerColor();
        const petalCount = 5 + Math.floor(Math.random() * 3);
        const petalSize = Math.max(5, this.brushSize * (0.8 + Math.random() * 0.4));
        const baseOpacity = 0.85 * (this.inkLevel / 100);
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.random() * Math.PI * 2);
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            
            this.ctx.save();
            this.ctx.rotate(angle);
            this.ctx.globalAlpha = baseOpacity * (0.6 + Math.random() * 0.4);
            
            const gradient = this.ctx.createRadialGradient(0, -petalSize * 0.5, 0, 0, -petalSize * 0.5, petalSize * 0.6);
            gradient.addColorStop(0, flowerColor);
            gradient.addColorStop(0.7, Utils.hexToRgba(flowerColor, 0.5));
            gradient.addColorStop(1, Utils.hexToRgba(flowerColor, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, -petalSize * 0.5, petalSize * 0.35, petalSize * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        this.ctx.globalAlpha = baseOpacity;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.max(2, petalSize * 0.15), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawLeaf(x, y) {
        const leafColor = this.seasonThemes.getLeafColor();
        const leafSize = Math.max(5, this.brushSize * (0.8 + Math.random() * 0.6));
        const baseOpacity = 0.85 * (this.inkLevel / 100);
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.random() * Math.PI * 2);
        
        const gradient = this.ctx.createLinearGradient(0, -leafSize, 0, leafSize);
        gradient.addColorStop(0, leafColor);
        gradient.addColorStop(0.5, Utils.hexToRgba(leafColor, 0.8));
        gradient.addColorStop(1, Utils.hexToRgba(leafColor, 0.4));
        
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = baseOpacity;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -leafSize);
        this.ctx.bezierCurveTo(
            leafSize * 0.5, -leafSize * 0.5,
            leafSize * 0.4, leafSize * 0.5,
            0, leafSize
        );
        this.ctx.bezierCurveTo(
            -leafSize * 0.4, leafSize * 0.5,
            -leafSize * 0.5, -leafSize * 0.5,
            0, -leafSize
        );
        this.ctx.fill();
        
        this.ctx.strokeStyle = Utils.hexToRgba('#000000', 0.15);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -leafSize * 0.8);
        this.ctx.lineTo(0, leafSize * 0.8);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    addInkBleed(x, y, size, color, opacity) {
        const bleedCount = Math.floor(this.wetness / 25);
        
        for (let i = 0; i < bleedCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.max(1, size * (0.3 + Math.random() * 0.6));
            const bleedX = x + Math.cos(angle) * distance;
            const bleedY = y + Math.sin(angle) * distance;
            const bleedSize = Math.max(1, size * 0.15 * Math.random());
            
            const gradient = this.ctx.createRadialGradient(bleedX, bleedY, 0, bleedX, bleedY, bleedSize);
            gradient.addColorStop(0, Utils.hexToRgba(color, opacity * Math.random()));
            gradient.addColorStop(1, Utils.hexToRgba(color, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bleedX, bleedY, bleedSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
