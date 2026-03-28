class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.bgTexture1 = null;
        this.bgTexture2 = null;
        this.currentBg = 1;
        
        this.loadBackgroundTextures();
    }
    
    loadBackgroundTextures() {
        this.bgTexture1 = new Image();
        this.bgTexture1.crossOrigin = "anonymous";
        this.bgTexture1.onload = () => {
            this.initPaper();
        };
        this.bgTexture1.onerror = () => {
            console.warn('背景纹理1加载失败，使用程序生成背景');
            this.initPaper();
        };
        this.bgTexture1.src = 'assets/bg1.png';
        
        this.bgTexture2 = new Image();
        this.bgTexture2.crossOrigin = "anonymous";
        this.bgTexture2.onerror = () => {
            console.warn('背景纹理2加载失败');
        };
        this.bgTexture2.src = 'assets/bg2.png';
    }
    
    initPaper() {
        this.ctx.fillStyle = '#f5f3ef';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawBackgroundTexture();
    }
    
    drawBackgroundTexture() {
        const bgImage = this.currentBg === 1 ? this.bgTexture1 : this.bgTexture2;
        
        if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.85;
            
            const scale = Math.max(this.width / bgImage.width, this.height / bgImage.height);
            const scaledWidth = bgImage.width * scale;
            const scaledHeight = bgImage.height * scale;
            const offsetX = (this.width - scaledWidth) / 2;
            const offsetY = (this.height - scaledHeight) / 2;
            
            this.ctx.drawImage(bgImage, offsetX, offsetY, scaledWidth, scaledHeight);
            this.ctx.restore();
        }
        
        this.drawPaperOverlay();
    }
    
    drawPaperOverlay() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.03;
        this.ctx.strokeStyle = '#c8c8c0';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < 50; i++) {
            const startX = Math.random() * this.width;
            const startY = Math.random() * this.height;
            const length = Math.random() * 60 + 15;
            const angle = Math.random() * Math.PI * 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            
            let x = startX;
            let y = startY;
            
            for (let j = 0; j < 3; j++) {
                x += Math.cos(angle + (Math.random() - 0.5) * 0.3) * length / 3;
                y += Math.sin(angle + (Math.random() - 0.5) * 0.3) * length / 3;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    setBackground(bgNumber) {
        this.currentBg = bgNumber;
        this.clear();
    }
    
    clear() {
        this.ctx.fillStyle = '#f5f3ef';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawBackgroundTexture();
    }
    
    save(filename = 'ink-painting.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    getContext() {
        return this.ctx;
    }
}
