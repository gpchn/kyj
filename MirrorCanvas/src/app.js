class MirrorCanvas {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.brushSize = 8;
        this.brushOpacity = 1;
        this.brushColor = '#1a1a1a';
        
        this.symmetryMode = 'vertical';
        this.radialSegments = 8;
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.brushPreview = document.getElementById('brush-preview');
        this.mirrorLine = document.getElementById('mirror-line');
        
        this.magicMode = false;
        this.rainbowMode = false;
        this.rainbowHue = 0;
        this.particleMode = false;
        this.particles = [];
        this.neonMode = false;
        
        this.trailPoints = [];
        this.maxTrailLength = 20;
        
        this.init();
        this.bindEvents();
        this.startAnimation();
    }
    
    init() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.updateMirrorLine();
    }
    
    startAnimation() {
        this.animateParticles();
    }
    
    animateParticles() {
        if (this.particles.length > 0) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.life -= 0.02;
                p.size *= 0.98;
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
                
                this.ctx.save();
                this.ctx.globalAlpha = p.life * p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        
        requestAnimationFrame(() => this.animateParticles());
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        document.addEventListener('mousemove', (e) => this.updateBrushPreview(e));
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setSymmetryMode(mode);
            });
        });
        
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('size-value').textContent = this.brushSize + 'px';
        });
        
        document.getElementById('brush-opacity').addEventListener('input', (e) => {
            this.brushOpacity = parseInt(e.target.value) / 100;
            document.getElementById('opacity-value').textContent = e.target.value + '%';
        });
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setColor(color);
            });
        });
        
        document.getElementById('custom-color').addEventListener('input', (e) => {
            this.setColor(e.target.value);
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveImage();
        });
        
        document.querySelectorAll('.fun-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.toggleFunMode(mode, e.currentTarget);
            });
        });
        
        document.getElementById('radial-segments').addEventListener('input', (e) => {
            this.radialSegments = parseInt(e.target.value);
            document.getElementById('segments-value').textContent = this.radialSegments;
        });
    }
    
    toggleFunMode(mode, btn) {
        switch (mode) {
            case 'neon':
                this.neonMode = !this.neonMode;
                btn.classList.toggle('active', this.neonMode);
                break;
            case 'rainbow':
                this.rainbowMode = !this.rainbowMode;
                btn.classList.toggle('active', this.rainbowMode);
                break;
            case 'particle':
                this.particleMode = !this.particleMode;
                btn.classList.toggle('active', this.particleMode);
                break;
        }
    }
    
    setSymmetryMode(mode) {
        this.symmetryMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        const radialSection = document.getElementById('radial-section');
        if (radialSection) {
            radialSection.style.display = mode === 'radial' ? 'block' : 'none';
        }
        
        this.updateMirrorLine();
    }
    
    updateMirrorLine() {
        const canvasArea = document.querySelector('.canvas-area');
        const existingLines = canvasArea.querySelectorAll('.mirror-line');
        existingLines.forEach(line => line.remove());
        
        if (this.symmetryMode === 'vertical' || this.symmetryMode === 'quad') {
            const line = document.createElement('div');
            line.className = 'mirror-line vertical';
            canvasArea.appendChild(line);
        }
        
        if (this.symmetryMode === 'horizontal' || this.symmetryMode === 'quad') {
            const line = document.createElement('div');
            line.className = 'mirror-line horizontal';
            canvasArea.appendChild(line);
        }
    }
    
    setColor(color) {
        this.brushColor = color;
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        
        document.getElementById('custom-color').value = color;
    }
    
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCanvasCoords(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        this.drawPoint(coords.x, coords.y);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCanvasCoords(e);
        
        this.drawLine(this.lastX, this.lastY, coords.x, coords.y);
        
        this.lastX = coords.x;
        this.lastY = coords.y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    drawPoint(x, y) {
        const points = this.getMirrorPoints(x, y);
        let color = this.brushColor;
        
        if (this.rainbowMode) {
            this.rainbowHue = (this.rainbowHue + 2) % 360;
            color = `hsl(${this.rainbowHue}, 80%, 50%)`;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = this.brushOpacity;
        
        points.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.brushSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (this.particleMode) {
                this.spawnParticles(point.x, point.y, color);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawLine(x1, y1, x2, y2) {
        const startPoints = this.getMirrorPoints(x1, y1);
        const endPoints = this.getMirrorPoints(x2, y2);
        
        let color = this.brushColor;
        
        if (this.rainbowMode) {
            this.rainbowHue = (this.rainbowHue + 3) % 360;
            color = `hsl(${this.rainbowHue}, 80%, 50%)`;
        }
        
        for (let i = 0; i < startPoints.length; i++) {
            if (this.neonMode) {
                this.ctx.save();
                
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 20;
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = this.brushSize * 0.5;
                this.ctx.globalAlpha = this.brushOpacity;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startPoints[i].x, startPoints[i].y);
                this.ctx.lineTo(endPoints[i].x, endPoints[i].y);
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 40;
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = this.brushSize * 0.3;
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 60;
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = this.brushSize * 0.15;
                this.ctx.stroke();
                
                this.ctx.restore();
            } else {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = this.brushSize;
                this.ctx.globalAlpha = this.brushOpacity;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startPoints[i].x, startPoints[i].y);
                this.ctx.lineTo(endPoints[i].x, endPoints[i].y);
                this.ctx.stroke();
            }
            
            if (this.particleMode) {
                this.spawnParticles(endPoints[i].x, endPoints[i].y, color);
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    shiftHue(color, amount) {
        if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),/);
            if (match) {
                const hue = (parseInt(match[1]) + amount) % 360;
                return color.replace(/hsl\(\d+,/, `hsl(${hue},`);
            }
        }
        return color;
    }
    
    spawnParticles(x, y, color) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * this.brushSize,
                y: y + (Math.random() - 0.5) * this.brushSize,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1,
                size: this.brushSize * 0.3 * Math.random(),
                color: color,
                alpha: this.brushOpacity,
                life: 1
            });
        }
    }
    
    getMirrorPoints(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const points = [{ x, y }];
        
        switch (this.symmetryMode) {
            case 'vertical':
                points.push({ x: centerX - (x - centerX), y });
                break;
                
            case 'horizontal':
                points.push({ x, y: centerY - (y - centerY) });
                break;
                
            case 'quad':
                points.push({ x: centerX - (x - centerX), y });
                points.push({ x, y: centerY - (y - centerY) });
                points.push({ x: centerX - (x - centerX), y: centerY - (y - centerY) });
                break;
                
            case 'radial':
                const angle = Math.atan2(y - centerY, x - centerX);
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                for (let i = 1; i < this.radialSegments; i++) {
                    const newAngle = angle + (i * 2 * Math.PI / this.radialSegments);
                    points.push({
                        x: centerX + Math.cos(newAngle) * distance,
                        y: centerY + Math.sin(newAngle) * distance
                    });
                }
                break;
        }
        
        return points;
    }
    
    updateBrushPreview(e) {
        const rect = this.canvas.getBoundingClientRect();
        const isOverCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                            e.clientY >= rect.top && e.clientY <= rect.bottom;
        
        if (isOverCanvas) {
            this.brushPreview.style.display = 'block';
            this.brushPreview.style.left = e.clientX + 'px';
            this.brushPreview.style.top = e.clientY + 'px';
            this.brushPreview.style.width = this.brushSize + 'px';
            this.brushPreview.style.height = this.brushSize + 'px';
            this.brushPreview.style.backgroundColor = this.brushColor;
            this.brushPreview.style.opacity = this.brushOpacity;
        } else {
            this.brushPreview.style.display = 'none';
        }
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    saveImage() {
        const link = document.createElement('a');
        link.download = `mirror-canvas-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MirrorCanvas();
});
