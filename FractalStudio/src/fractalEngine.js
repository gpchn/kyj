class FractalEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.maxIterations = 256;
        this.fractalType = 'mandelbrot';
        this.colorScheme = 'cosmic';
        
        this.centerX = -0.5;
        this.centerY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        
        this.juliaC = { real: -0.70, imag: 0.27 };
        
        this.isRendering = false;
        this.onProgress = null;
        this.onComplete = null;
        
        this.previewCanvas = document.createElement('canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.previewScale = 0.25;
        
        this.cachedCanvas = document.createElement('canvas');
        this.cachedCtx = this.cachedCanvas.getContext('2d');
        this.hasCache = false;
        this.cacheZoom = 1;
        this.cacheCenterX = 0;
        this.cacheCenterY = 0;
        
        this.renderQueue = [];
        this.isProcessingQueue = false;
        
        this.lastRenderTime = 0;
        this.minRenderInterval = 50;
    }
    
    setFractalType(type) {
        this.fractalType = type;
        this.hasCache = false;
    }
    
    setColorScheme(scheme) {
        this.colorScheme = scheme;
    }
    
    setMaxIterations(iterations) {
        this.maxIterations = iterations;
    }
    
    setJuliaC(real, imag) {
        this.juliaC = { real, imag };
        this.hasCache = false;
    }
    
    setCenter(x, y) {
        this.centerX = x;
        this.centerY = y;
    }
    
    setZoom(zoom) {
        this.zoom = Math.max(0.0001, zoom);
    }
    
    reset() {
        if (this.fractalType === 'mandelbrot') {
            this.centerX = -0.5;
            this.centerY = 0;
        } else if (this.fractalType === 'julia') {
            this.centerX = 0;
            this.centerY = 0;
        } else if (this.fractalType === 'burningship') {
            this.centerX = -0.4;
            this.centerY = -0.6;
        } else {
            this.centerX = 0;
            this.centerY = 0;
        }
        this.zoom = 1;
        this.hasCache = false;
    }
    
    async renderPreview() {
        const previewWidth = Math.floor(this.width * this.previewScale);
        const previewHeight = Math.floor(this.height * this.previewScale);
        
        this.previewCanvas.width = previewWidth;
        this.previewCanvas.height = previewHeight;
        
        const imageData = this.previewCtx.createImageData(previewWidth, previewHeight);
        const data = imageData.data;
        
        const aspectRatio = this.width / this.height;
        const scale = 3 / this.zoom;
        
        const xMin = this.centerX - scale * aspectRatio / 2;
        const xMax = this.centerX + scale * aspectRatio / 2;
        const yMin = this.centerY - scale / 2;
        const yMax = this.centerY + scale / 2;
        
        const reducedIterations = Math.max(50, Math.floor(this.maxIterations * 0.5));
        
        for (let py = 0; py < previewHeight; py++) {
            for (let px = 0; px < previewWidth; px++) {
                const x0 = Utils.mapRange(px, 0, previewWidth, xMin, xMax);
                const y0 = Utils.mapRange(py, 0, previewHeight, yMin, yMax);
                
                let iterations;
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x0, y0, reducedIterations);
                        break;
                    case 'julia':
                        iterations = this.julia(x0, y0, reducedIterations);
                        break;
                    case 'burningship':
                        iterations = this.burningShip(x0, y0, reducedIterations);
                        break;
                    case 'tricorn':
                        iterations = this.tricorn(x0, y0, reducedIterations);
                        break;
                    default:
                        iterations = this.mandelbrot(x0, y0, reducedIterations);
                }
                
                const color = this.getColor(iterations, reducedIterations);
                
                const idx = (py * previewWidth + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }
        
        this.previewCtx.putImageData(imageData, 0, 0);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.drawImage(this.previewCanvas, 0, 0, this.width, this.height);
    }
    
    async render() {
        if (this.isRendering) return;
        this.isRendering = true;
        
        const startTime = performance.now();
        
        await this.renderPreview();
        
        if (this.onProgress) {
            this.onProgress(0.3);
        }
        
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        const aspectRatio = this.width / this.height;
        const scale = 3 / this.zoom;
        
        const xMin = this.centerX - scale * aspectRatio / 2;
        const xMax = this.centerX + scale * aspectRatio / 2;
        const yMin = this.centerY - scale / 2;
        const yMax = this.centerY + scale / 2;
        
        const chunkSize = 20;
        const rowsPerFrame = Math.ceil(this.height / 30);
        
        for (let startY = 0; startY < this.height; startY += rowsPerFrame) {
            const endY = Math.min(startY + rowsPerFrame, this.height);
            
            await this.renderChunk(data, startY, endY, xMin, xMax, yMin, yMax);
            
            if (this.onProgress) {
                const progress = 0.3 + (endY / this.height) * 0.7;
                this.onProgress(progress);
            }
            
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        this.updateCache();
        
        this.isRendering = false;
        
        const endTime = performance.now();
        if (this.onComplete) {
            this.onComplete(endTime - startTime);
        }
    }
    
    async renderChunk(data, startY, endY, xMin, xMax, yMin, yMax) {
        const aspectRatio = this.width / this.height;
        const scale = 3 / this.zoom;
        
        for (let py = startY; py < endY; py++) {
            for (let px = 0; px < this.width; px++) {
                const x0 = Utils.mapRange(px, 0, this.width, xMin, xMax);
                const y0 = Utils.mapRange(py, 0, this.height, yMin, yMax);
                
                let iterations;
                
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                        break;
                    case 'julia':
                        iterations = this.julia(x0, y0, this.maxIterations);
                        break;
                    case 'burningship':
                        iterations = this.burningShip(x0, y0, this.maxIterations);
                        break;
                    case 'tricorn':
                        iterations = this.tricorn(x0, y0, this.maxIterations);
                        break;
                    default:
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                }
                
                const color = this.getColor(iterations, this.maxIterations);
                
                const idx = (py * this.width + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }
    }
    
    updateCache() {
        this.cachedCanvas.width = this.width;
        this.cachedCanvas.height = this.height;
        this.cachedCtx.drawImage(this.canvas, 0, 0);
        
        this.cacheZoom = this.zoom;
        this.cacheCenterX = this.centerX;
        this.cacheCenterY = this.centerY;
        this.hasCache = true;
    }
    
    renderFromCache() {
        if (!this.hasCache) return false;
        
        const zoomRatio = this.zoom / this.cacheZoom;
        
        if (zoomRatio > 0.5 && zoomRatio < 2) {
            const offsetX = (this.centerX - this.cacheCenterX) * this.width / (3 / this.zoom);
            const offsetY = (this.centerY - this.cacheCenterY) * this.height / (3 / this.zoom);
            
            if (Math.abs(offsetX) < this.width * 0.3 && Math.abs(offsetY) < this.height * 0.3) {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                this.ctx.save();
                this.ctx.translate(this.width / 2, this.height / 2);
                this.ctx.scale(zoomRatio, zoomRatio);
                this.ctx.translate(-this.width / 2 - offsetX, -this.height / 2 - offsetY);
                this.ctx.drawImage(this.cachedCanvas, 0, 0);
                this.ctx.restore();
                
                return true;
            }
        }
        
        return false;
    }
    
    requestRender() {
        const now = performance.now();
        
        if (now - this.lastRenderTime < this.minRenderInterval) {
            return;
        }
        
        this.lastRenderTime = now;
        
        if (!this.renderFromCache()) {
            this.render();
        }
    }
    
    mandelbrot(x0, y0, maxIter) {
        let x = 0;
        let y = 0;
        let iteration = 0;
        
        while (x * x + y * y <= 4 && iteration < maxIter) {
            const xTemp = x * x - y * y + x0;
            y = 2 * x * y + y0;
            x = xTemp;
            iteration++;
        }
        
        if (iteration === maxIter) {
            return maxIter;
        }
        
        return Utils.smoothColor(iteration, x * x + y * y);
    }
    
    julia(x0, y0, maxIter) {
        let x = x0;
        let y = y0;
        let iteration = 0;
        
        const cr = this.juliaC.real;
        const ci = this.juliaC.imag;
        
        while (x * x + y * y <= 4 && iteration < maxIter) {
            const xTemp = x * x - y * y + cr;
            y = 2 * x * y + ci;
            x = xTemp;
            iteration++;
        }
        
        if (iteration === maxIter) {
            return maxIter;
        }
        
        return Utils.smoothColor(iteration, x * x + y * y);
    }
    
    burningShip(x0, y0, maxIter) {
        let x = 0;
        let y = 0;
        let iteration = 0;
        
        while (x * x + y * y <= 4 && iteration < maxIter) {
            const xTemp = x * x - y * y + x0;
            y = Math.abs(2 * x * y) + y0;
            x = Math.abs(xTemp);
            iteration++;
        }
        
        if (iteration === maxIter) {
            return maxIter;
        }
        
        return Utils.smoothColor(iteration, x * x + y * y);
    }
    
    tricorn(x0, y0, maxIter) {
        let x = 0;
        let y = 0;
        let iteration = 0;
        
        while (x * x + y * y <= 4 && iteration < maxIter) {
            const xTemp = x * x - y * y + x0;
            y = -2 * x * y + y0;
            x = xTemp;
            iteration++;
        }
        
        if (iteration === maxIter) {
            return maxIter;
        }
        
        return Utils.smoothColor(iteration, x * x + y * y);
    }
    
    getColor(iterations, maxIter) {
        if (iterations >= maxIter) {
            return { r: 0, g: 0, b: 0 };
        }
        
        const scheme = COLOR_SCHEMES[this.colorScheme];
        if (!scheme) {
            return { r: 0, g: 0, b: 0 };
        }
        
        const t = iterations / maxIter;
        return scheme.getColor(t);
    }
    
    screenToComplex(screenX, screenY) {
        const aspectRatio = this.width / this.height;
        const scale = 3 / this.zoom;
        
        const x = this.centerX + (screenX / this.width - 0.5) * scale * aspectRatio;
        const y = this.centerY + (screenY / this.height - 0.5) * scale;
        
        return { x, y };
    }
    
    async exportHighResolution(scale = 2) {
        const exportWidth = this.width * scale;
        const exportHeight = this.height * scale;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        const exportCtx = exportCanvas.getContext('2d');
        
        const imageData = exportCtx.createImageData(exportWidth, exportHeight);
        const data = imageData.data;
        
        const aspectRatio = exportWidth / exportHeight;
        const scaleRatio = 3 / this.zoom;
        
        const xMin = this.centerX - scaleRatio * aspectRatio / 2;
        const xMax = this.centerX + scaleRatio * aspectRatio / 2;
        const yMin = this.centerY - scaleRatio / 2;
        const yMax = this.centerY + scaleRatio / 2;
        
        for (let py = 0; py < exportHeight; py++) {
            for (let px = 0; px < exportWidth; px++) {
                const x0 = Utils.mapRange(px, 0, exportWidth, xMin, xMax);
                const y0 = Utils.mapRange(py, 0, exportHeight, yMin, yMax);
                
                let iterations;
                
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                        break;
                    case 'julia':
                        iterations = this.julia(x0, y0, this.maxIterations);
                        break;
                    case 'burningship':
                        iterations = this.burningShip(x0, y0, this.maxIterations);
                        break;
                    case 'tricorn':
                        iterations = this.tricorn(x0, y0, this.maxIterations);
                        break;
                    default:
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                }
                
                const color = this.getColor(iterations, this.maxIterations);
                
                const idx = (py * exportWidth + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
            
            if (py % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        exportCtx.putImageData(imageData, 0, 0);
        
        const link = document.createElement('a');
        link.download = `fractal-${this.fractalType}-${exportWidth}x${exportHeight}-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png', 1.0);
        link.click();
    }
    
    exportImage() {
        this.exportHighResolution(1);
    }
    
    exportSVG(scale = 1) {
        const exportWidth = this.width * scale;
        const exportHeight = this.height * scale;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = exportWidth;
        tempCanvas.height = exportHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        const imageData = tempCtx.createImageData(exportWidth, exportHeight);
        const data = imageData.data;
        
        const aspectRatio = exportWidth / exportHeight;
        const scaleRatio = 3 / this.zoom;
        
        const xMin = this.centerX - scaleRatio * aspectRatio / 2;
        const xMax = this.centerX + scaleRatio * aspectRatio / 2;
        const yMin = this.centerY - scaleRatio / 2;
        const yMax = this.centerY + scaleRatio / 2;
        
        for (let py = 0; py < exportHeight; py++) {
            for (let px = 0; px < exportWidth; px++) {
                const x0 = Utils.mapRange(px, 0, exportWidth, xMin, xMax);
                const y0 = Utils.mapRange(py, 0, exportHeight, yMin, yMax);
                
                let iterations;
                
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                        break;
                    case 'julia':
                        iterations = this.julia(x0, y0, this.maxIterations);
                        break;
                    case 'burningship':
                        iterations = this.burningShip(x0, y0, this.maxIterations);
                        break;
                    case 'tricorn':
                        iterations = this.tricorn(x0, y0, this.maxIterations);
                        break;
                    default:
                        iterations = this.mandelbrot(x0, y0, this.maxIterations);
                }
                
                const color = this.getColor(iterations, this.maxIterations);
                
                const idx = (py * exportWidth + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        const pngDataUrl = tempCanvas.toDataURL('image/png', 1.0);
        
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${exportWidth}" 
     height="${exportHeight}" 
     viewBox="0 0 ${exportWidth} ${exportHeight}">
  <title>Fractal - ${this.fractalType}</title>
  <desc>Generated by FractalStudio | Center: (${this.centerX.toFixed(6)}, ${this.centerY.toFixed(6)}) | Zoom: ${this.zoom.toFixed(2)}x</desc>
  <image x="0" y="0" width="${exportWidth}" height="${exportHeight}" xlink:href="${pngDataUrl}"/>
</svg>`;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `fractal-${this.fractalType}-${exportWidth}x${exportHeight}-${Date.now()}.svg`;
        link.href = url;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}
