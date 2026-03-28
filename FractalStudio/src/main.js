class App {
    constructor() {
        this.canvas = document.getElementById('fractal-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.engine = new FractalEngine(this.canvas);
        
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCenter = { x: 0, y: 0 };
        
        this.exportScale = 2;
        this.hasUnrenderedChanges = false;
        
        this.initUI();
        this.bindEvents();
        this.render();
    }
    
    initUI() {
        document.getElementById('iterations-value').textContent = this.engine.maxIterations;
        document.getElementById('julia-real-value').textContent = this.engine.juliaC.real.toFixed(2);
        document.getElementById('julia-imag-value').textContent = this.engine.juliaC.imag.toFixed(2);
        
        this.updateInfo();
    }
    
    bindEvents() {
        document.querySelectorAll('.fractal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.setFractalType(type);
            });
        });
        
        document.getElementById('iterations').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('iterations-value').textContent = value;
            this.engine.setMaxIterations(value);
            this.markNeedsRender();
        });
        
        document.getElementById('julia-real').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('julia-real-value').textContent = value.toFixed(2);
            this.engine.setJuliaC(value, this.engine.juliaC.imag);
            this.markNeedsRender();
        });
        
        document.getElementById('julia-imag').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('julia-imag-value').textContent = value.toFixed(2);
            this.engine.setJuliaC(this.engine.juliaC.real, value);
            this.markNeedsRender();
        });
        
        document.querySelectorAll('.color-scheme').forEach(scheme => {
            scheme.addEventListener('click', (e) => {
                const name = e.target.dataset.scheme;
                this.setColorScheme(name);
            });
        });
        
        document.querySelectorAll('.resolution-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.exportScale = parseInt(e.target.dataset.scale);
            });
        });
        
        document.getElementById('render-btn').addEventListener('click', () => {
            this.render();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('export-png-btn').addEventListener('click', () => {
            this.engine.exportHighResolution(this.exportScale);
        });
        
        document.getElementById('export-svg-btn').addEventListener('click', () => {
            this.engine.exportSVG(this.exportScale);
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.startDrag(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleDrag(e);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.endDrag();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.endDrag();
        });
        
        this.canvas.addEventListener('dblclick', () => {
            this.reset();
        });
        
        this.engine.onProgress = (progress) => {
            this.updateProgress(progress);
        };
        
        this.engine.onComplete = (time) => {
            this.onRenderComplete(time);
        };
    }
    
    setFractalType(type) {
        this.engine.setFractalType(type);
        
        document.querySelectorAll('.fractal-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        const juliaParams = document.getElementById('julia-params');
        juliaParams.classList.toggle('visible', type === 'julia');
        
        this.engine.reset();
        this.hasUnrenderedChanges = false;
        this.hideHint();
        this.render();
    }
    
    setColorScheme(name) {
        this.engine.setColorScheme(name);
        
        document.querySelectorAll('.color-scheme').forEach(scheme => {
            scheme.classList.toggle('active', scheme.dataset.scheme === name);
        });
        
        this.markNeedsRender();
    }
    
    markNeedsRender() {
        this.hasUnrenderedChanges = true;
        this.showHint();
    }
    
    showHint() {
        document.getElementById('hint-badge').classList.add('visible');
    }
    
    hideHint() {
        document.getElementById('hint-badge').classList.remove('visible');
    }
    
    handleZoom(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const pos = this.engine.screenToComplex(mouseX, mouseY);
        
        const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
        const newZoom = this.engine.zoom * zoomFactor;
        
        const zoomRatio = newZoom / this.engine.zoom;
        
        this.engine.centerX = pos.x - (pos.x - this.engine.centerX) / zoomRatio;
        this.engine.centerY = pos.y - (pos.y - this.engine.centerY) / zoomRatio;
        this.engine.setZoom(newZoom);
        
        this.updateInfo();
        this.markNeedsRender();
        this.updatePreviewTransform();
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.dragCenter = {
            x: this.engine.centerX,
            y: this.engine.centerY
        };
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleDrag(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        const scale = 3 / this.engine.zoom;
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        this.engine.centerX = this.dragCenter.x - (dx / this.canvas.width) * scale * aspectRatio;
        this.engine.centerY = this.dragCenter.y - (dy / this.canvas.height) * scale;
        
        this.updateInfo();
        this.markNeedsRender();
        this.updatePreviewTransform();
    }
    
    updatePreviewTransform() {
        if (!this.engine.hasCache) return;
        
        const zoomRatio = this.engine.zoom / this.engine.cacheZoom;
        const offsetX = (this.engine.centerX - this.engine.cacheCenterX) / (3 / this.engine.zoom) * this.canvas.width;
        const offsetY = (this.engine.centerY - this.engine.cacheCenterY) / (3 / this.engine.zoom) * this.canvas.height;
        
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(zoomRatio, zoomRatio);
        this.ctx.translate(-this.canvas.width / 2 - offsetX, -this.canvas.height / 2 - offsetY);
        this.ctx.globalAlpha = 0.6;
        this.ctx.drawImage(this.engine.cachedCanvas, 0, 0);
        this.ctx.restore();
    }
    
    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }
    
    updateProgress(progress) {
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${progress * 100}%`;
        progressBar.classList.toggle('rendering', progress < 1);
    }
    
    onRenderComplete(time) {
        document.getElementById('render-time').textContent = Math.round(time);
        this.updateProgress(1);
    }
    
    updateInfo() {
        document.getElementById('center-x').textContent = this.engine.centerX.toFixed(6);
        document.getElementById('center-y').textContent = this.engine.centerY.toFixed(6);
        document.getElementById('zoom-level').textContent = this.engine.zoom.toFixed(2) + 'x';
    }
    
    reset() {
        this.engine.reset();
        this.updateInfo();
        this.hasUnrenderedChanges = false;
        this.hideHint();
        this.render();
    }
    
    async render() {
        const renderBtn = document.getElementById('render-btn');
        renderBtn.textContent = '渲染中...';
        renderBtn.disabled = true;
        
        this.hasUnrenderedChanges = false;
        this.hideHint();
        
        await this.engine.render();
        
        renderBtn.textContent = '渲染分形';
        renderBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
