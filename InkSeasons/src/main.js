class App {
    constructor() {
        this.canvasRenderer = new CanvasRenderer('canvas');
        this.seasonThemes = new SeasonThemes();
        this.brushEngine = new BrushEngine(
            this.canvasRenderer.canvas,
            this.seasonThemes
        );
        
        this.bindEvents();
        this.updateUI();
    }
    
    getCanvasCoords(e) {
        const canvas = this.canvasRenderer.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    bindEvents() {
        const canvas = this.canvasRenderer.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            const coords = this.getCanvasCoords(e);
            this.brushEngine.startStroke(coords.x, coords.y);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.brushEngine.isDrawing) return;
            
            const coords = this.getCanvasCoords(e);
            this.brushEngine.continueStroke(coords.x, coords.y);
            this.updateInkLevel();
        });
        
        canvas.addEventListener('mouseup', () => {
            this.brushEngine.endStroke();
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.brushEngine.endStroke();
        });
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch);
            this.brushEngine.startStroke(coords.x, coords.y);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.brushEngine.isDrawing) return;
            
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch);
            this.brushEngine.continueStroke(coords.x, coords.y);
            this.updateInkLevel();
        });
        
        canvas.addEventListener('touchend', () => {
            this.brushEngine.endStroke();
        });
        
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.seasonThemes.setSeason(btn.dataset.season);
                this.updateUI();
            });
        });
        
        document.querySelectorAll('.brush-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.seasonThemes.setBrush(btn.dataset.brush);
                this.updateUI();
            });
        });
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const color = btn.dataset.color;
                if (color === 'ink') {
                    this.seasonThemes.resetToInkColor();
                } else {
                    this.seasonThemes.setColor(color);
                }
                this.updateColorPreview();
            });
        });
        
        document.getElementById('brush-size').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.brushEngine.setBrushSize(size);
            document.getElementById('size-value').textContent = size + 'px';
        });
        
        document.getElementById('ink-density').addEventListener('input', (e) => {
            const density = parseInt(e.target.value);
            this.brushEngine.setInkDensity(density);
            document.getElementById('density-value').textContent = density + '%';
            this.updateColorPreview();
        });
        
        document.getElementById('wetness').addEventListener('input', (e) => {
            const wetness = parseInt(e.target.value);
            this.brushEngine.setWetness(wetness);
            document.getElementById('wetness-value').textContent = wetness + '%';
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.canvasRenderer.clear();
            this.brushEngine.refillInk();
            this.updateInkLevel();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            const theme = this.seasonThemes.getCurrentTheme();
            const filename = `墨韵四季_${theme.name}_${Date.now()}.png`;
            this.canvasRenderer.save(filename);
        });
        
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const bgNumber = parseInt(btn.dataset.bg);
                this.canvasRenderer.setBackground(bgNumber);
            });
        });
    }
    
    updateUI() {
        this.updateColorPreview();
    }
    
    updateColorPreview() {
        const inkColor = this.seasonThemes.getInkColor(this.brushEngine.inkDensity);
        const theme = this.seasonThemes.getCurrentTheme();
        
        document.getElementById('color-swatch').style.background = inkColor.color;
        document.getElementById('color-name').textContent = inkColor.name || '自定义颜色';
        document.getElementById('color-hex').textContent = inkColor.color;
    }
    
    updateInkLevel() {
        const level = this.brushEngine.inkLevel;
        document.getElementById('ink-fill').style.width = level + '%';
        document.querySelector('.ink-label').textContent = Math.round(level) + '%';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
