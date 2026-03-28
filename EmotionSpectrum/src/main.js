class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.audioAnalyzer = new AudioAnalyzer();
        this.emotionEngine = new EmotionEngine();
        
        this.visualizers = {
            wave: new WaveVisualizer(this.canvas),
            particle: new ParticleVisualizer(this.canvas),
            spiral: new SpiralVisualizer(this.canvas),
            kaleidoscope: new KaleidoscopeVisualizer(this.canvas)
        };
        
        this.currentMode = 'wave';
        this.isRunning = false;
        this.isAudioActive = false;
        this.permissionRequested = false;
        
        this.lastTime = 0;
        this.time = 0;
        
        this.elements = {
            emotionName: document.getElementById('emotion-name'),
            emotionIntensity: document.getElementById('emotion-intensity'),
            volumeValue: document.getElementById('volume-value'),
            freqValue: document.getElementById('freq-value'),
            freqBars: document.getElementById('freq-bars'),
            status: document.getElementById('status'),
            permissionOverlay: document.getElementById('permission-overlay'),
            startBtn: document.getElementById('start-btn')
        };
        
        this.initFrequencyBars();
        this.bindEvents();
        this.resize();
        
        this.startIdleAnimation();
    }
    
    initFrequencyBars() {
        const numBars = 16;
        this.elements.freqBars.innerHTML = '';
        for (let i = 0; i < numBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'freq-bar';
            bar.style.height = '2px';
            this.elements.freqBars.appendChild(bar);
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setMode(mode);
            });
        });
        
        this.emotionEngine.onEmotionChange = (emotion, confidence) => {
            this.onEmotionChange(emotion, confidence);
        };
        
        this.audioAnalyzer.onVolumeChange = (volume) => {
            this.onVolumeChange(volume);
        };
        
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                this.requestPermissionAndStart();
            });
        }
        
        const gainSlider = document.getElementById('gain-slider');
        if (gainSlider) {
            gainSlider.addEventListener('input', (e) => {
                const gain = parseFloat(e.target.value);
                this.audioAnalyzer.setManualGain(gain);
                document.getElementById('gain-value').textContent = gain + 'x';
            });
        }
        
        const calibrateBtn = document.getElementById('calibrate-btn');
        if (calibrateBtn) {
            calibrateBtn.addEventListener('click', () => {
                const level = this.audioAnalyzer.calibrateToCurrentLevel();
                this.elements.status.textContent = `已校准 (环境: ${Math.round(level * 100)}%)`;
                setTimeout(() => {
                    this.elements.status.textContent = '正在聆听';
                }, 2000);
            });
        }
        
        const resetCalibrateBtn = document.getElementById('reset-calibrate-btn');
        if (resetCalibrateBtn) {
            resetCalibrateBtn.addEventListener('click', () => {
                this.audioAnalyzer.resetCalibration();
                const gainSlider = document.getElementById('gain-slider');
                if (gainSlider) {
                    gainSlider.value = 3;
                    document.getElementById('gain-value').textContent = '3x';
                    this.audioAnalyzer.setManualGain(3);
                }
                this.elements.status.textContent = '已重置校准';
                setTimeout(() => {
                    this.elements.status.textContent = '正在聆听';
                }, 1500);
            });
        }
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        Object.values(this.visualizers).forEach(v => v.resize(width, height));
    }
    
    async requestPermissionAndStart() {
        if (this.permissionRequested) return;
        this.permissionRequested = true;
        
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = '正在连接...';
            this.elements.startBtn.disabled = true;
        }
        
        const success = await this.startAudio();
        
        if (success && this.elements.permissionOverlay) {
            this.elements.permissionOverlay.style.opacity = '0';
            setTimeout(() => {
                this.elements.permissionOverlay.style.display = 'none';
            }, 300);
        }
    }
    
    async startAudio() {
        try {
            this.elements.status.textContent = '正在初始化麦克风...';
            
            const success = await this.audioAnalyzer.init();
            
            if (success) {
                this.isAudioActive = true;
                this.isRunning = true;
                this.elements.status.textContent = '正在聆听';
                this.elements.emotionName.classList.add('visible');
                this.lastTime = performance.now();
                this.loop();
                return true;
            } else {
                this.elements.status.textContent = '无法访问麦克风';
                if (this.elements.startBtn) {
                    this.elements.startBtn.textContent = '重试';
                    this.elements.startBtn.disabled = false;
                    this.permissionRequested = false;
                }
                return false;
            }
        } catch (error) {
            console.error('启动音频失败:', error);
            this.elements.status.textContent = '启动失败，请检查权限';
            if (this.elements.startBtn) {
                this.elements.startBtn.textContent = '重试';
                this.elements.startBtn.disabled = false;
                this.permissionRequested = false;
            }
            return false;
        }
    }
    
    stopAudio() {
        this.audioAnalyzer.stop();
        this.isAudioActive = false;
        this.isRunning = false;
        this.elements.status.textContent = '已停止';
        this.elements.emotionName.classList.remove('visible');
        
        this.clearCanvas();
        this.startIdleAnimation();
    }
    
    setMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.clearCanvas();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        Object.values(this.visualizers).forEach(v => v.clear());
    }
    
    loop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.time += deltaTime * 0.001;
        
        this.audioAnalyzer.analyze();
        const emotionData = this.emotionEngine.analyze(this.audioAnalyzer);
        
        this.updateUI(emotionData);
        
        const visualizer = this.visualizers[this.currentMode];
        if (visualizer && typeof visualizer.render === 'function') {
            visualizer.render(this.audioAnalyzer, this.emotionEngine, deltaTime);
        }
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    updateUI(emotionData) {
        const volume = this.audioAnalyzer.getVolume();
        const frequency = this.audioAnalyzer.getFrequency();
        const bands = this.audioAnalyzer.getFrequencyBands();
        
        this.elements.volumeValue.textContent = this.audioAnalyzer.getVolumeInDb() + ' dB';
        this.elements.freqValue.textContent = this.audioAnalyzer.getDominantFrequencyHz() + ' Hz';
        
        this.updateFrequencyBars(bands);
        
        if (emotionData && emotionData.config) {
            const config = emotionData.config;
            this.elements.emotionName.textContent = config.name;
            this.elements.emotionName.style.color = `hsl(${config.color.h}, ${config.color.s}%, ${config.color.l}%)`;
            
            const intensityPercent = Math.round(emotionData.intensity * 100);
            this.elements.emotionIntensity.textContent = `强度 ${intensityPercent}%`;
        }
    }
    
    updateFrequencyBars(bands) {
        const barElements = this.elements.freqBars.children;
        const bandValues = [
            bands.bass,
            bands.lowMid,
            bands.mid,
            bands.highMid,
            bands.treble,
            bands.bass * 0.8,
            bands.lowMid * 0.8,
            bands.mid * 0.8,
            bands.highMid * 0.8,
            bands.treble * 0.8,
            bands.bass * 0.6,
            bands.lowMid * 0.6,
            bands.mid * 0.6,
            bands.highMid * 0.6,
            bands.treble * 0.6,
            bands.bass * 0.4
        ];
        
        for (let i = 0; i < barElements.length; i++) {
            const value = bandValues[i] || 0;
            const height = 2 + value * 30;
            barElements[i].style.height = height + 'px';
        }
    }
    
    onEmotionChange(emotion, confidence) {
        const config = EMOTION_CONFIG[emotion];
        if (!config) return;
        
        this.elements.emotionName.style.transition = 'all 0.5s ease';
        this.elements.emotionName.textContent = config.name;
        this.elements.emotionName.style.color = `hsl(${config.color.h}, ${config.color.s}%, ${config.color.l}%)`;
        this.elements.emotionName.style.textShadow = `0 0 100px hsla(${config.color.h}, ${config.color.s}%, ${config.color.l}%, 0.8)`;
    }
    
    onVolumeChange(volume) {
        // Volume change handler
    }
    
    startIdleAnimation() {
        const animate = () => {
            if (this.isAudioActive) return;
            
            this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const time = Date.now() * 0.001;
            
            for (let i = 0; i < 3; i++) {
                const radius = 100 + i * 50 + Math.sin(time + i) * 20;
                const opacity = 0.1 - i * 0.03;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
