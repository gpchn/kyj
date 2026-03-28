class ColorChallengeGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('colorChallengeBest') || '0');
        this.lives = 3;
        this.maxLives = 3;
        
        this.baseBlockCount = 4;
        this.baseColorDiff = 50;
        
        this.currentCorrectIndex = -1;
        this.baseColor = null;
        this.differentColor = null;
        
        this.startTime = 0;
        this.isPlaying = false;
        
        this.combo = 0;
        this.maxCombo = 0;
        this.lastCorrectTime = 0;
        
        this.particles = [];
        this.particleCanvas = null;
        this.particleCtx = null;
        
        this.audioContext = null;
        this.soundEnabled = true;
        
        this.initElements();
        this.bindEvents();
        this.updateBestScore();
        this.initParticleCanvas();
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }
    
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const now = this.audioContext.currentTime;
        
        switch (type) {
            case 'correct':
                this.playCorrectSound(now);
                break;
            case 'wrong':
                this.playWrongSound(now);
                break;
            case 'combo':
                this.playComboSound(now);
                break;
            case 'levelUp':
                this.playLevelUpSound(now);
                break;
            case 'gameOver':
                this.playGameOverSound(now);
                break;
        }
    }
    
    playCorrectSound(now) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    playWrongSound(now) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    playComboSound(now) {
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            
            gain.gain.setValueAtTime(0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }
    
    playLevelUpSound(now) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }
    
    playGameOverSound(now) {
        const frequencies = [392, 349.23, 329.63, 261.63];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gain.gain.setValueAtTime(0.25, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.2);
        });
    }
    
    initParticleCanvas() {
        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.id = 'particle-canvas';
        this.particleCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.particleCanvas);
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        window.addEventListener('resize', () => this.resizeParticleCanvas());
        this.resizeParticleCanvas();
        this.animateParticles();
    }
    
    resizeParticleCanvas() {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
    }
    
    initElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameBoard = document.getElementById('game-board');
        this.levelDisplay = document.getElementById('level');
        this.scoreDisplay = document.getElementById('score');
        this.bestDisplay = document.getElementById('best');
        this.livesContainer = document.getElementById('lives');
        this.difficultyFill = document.getElementById('difficulty-fill');
        this.hintText = document.getElementById('hint-text');
        this.message = document.getElementById('message');
        this.messageTitle = document.getElementById('message-title');
        this.messageText = document.getElementById('message-text');
        this.comboDisplay = document.getElementById('combo-display');
    }
    
    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.startScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        
        this.level = 1;
        this.score = 0;
        this.lives = this.maxLives;
        this.combo = 0;
        this.maxCombo = 0;
        this.isPlaying = true;
        
        this.updateDisplay();
        this.updateLives();
        this.updateCombo();
        this.generateLevel();
    }
    
    restartGame() {
        this.message.classList.remove('show');
        this.startGame();
    }
    
    generateLevel() {
        this.startTime = Date.now();
        
        const blockCount = this.calculateBlockCount();
        const colorDiff = this.calculateColorDiff();
        
        this.baseColor = this.generateRandomColor();
        this.differentColor = this.generateDifferentColor(this.baseColor, colorDiff);
        
        this.currentCorrectIndex = Math.floor(Math.random() * blockCount);
        
        this.renderBoard(blockCount);
        this.updateDifficulty();
    }
    
    calculateBlockCount() {
        return Math.min(this.baseBlockCount + Math.floor(this.level / 2), 36);
    }
    
    calculateColorDiff() {
        return Math.max(this.baseColorDiff - this.level * 2, 5);
    }
    
    generateRandomColor() {
        return {
            h: Math.random() * 360,
            s: 40 + Math.random() * 40,
            l: 40 + Math.random() * 30
        };
    }
    
    generateDifferentColor(base, diff) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const channel = Math.floor(Math.random() * 3);
        
        let newColor = { ...base };
        
        switch (channel) {
            case 0:
                newColor.h = (base.h + direction * diff + 360) % 360;
                break;
            case 1:
                newColor.s = Math.max(0, Math.min(100, base.s + direction * diff * 0.5));
                break;
            case 2:
                newColor.l = Math.max(0, Math.min(100, base.l + direction * diff * 0.3));
                break;
        }
        
        return newColor;
    }
    
    hslToString(color) {
        return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
    }
    
    renderBoard(blockCount) {
        this.gameBoard.innerHTML = '';
        
        const cols = Math.ceil(Math.sqrt(blockCount));
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        for (let i = 0; i < blockCount; i++) {
            const block = document.createElement('div');
            block.className = 'color-block';
            
            const color = i === this.currentCorrectIndex ? 
                this.differentColor : this.baseColor;
            block.style.backgroundColor = this.hslToString(color);
            
            block.style.opacity = '0';
            block.style.transform = 'scale(0.5) rotateY(90deg)';
            
            block.addEventListener('click', () => this.handleBlockClick(i, block));
            
            this.gameBoard.appendChild(block);
            
            setTimeout(() => {
                block.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                block.style.opacity = '1';
                block.style.transform = 'scale(1) rotateY(0deg)';
            }, i * 30);
        }
    }
    
    handleBlockClick(index, block) {
        if (!this.isPlaying) return;
        
        if (index === this.currentCorrectIndex) {
            this.handleCorrect(block);
        } else {
            this.handleWrong(block);
        }
    }
    
    handleCorrect(block) {
        block.classList.add('correct');
        
        const rect = block.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const now = Date.now();
        if (now - this.lastCorrectTime < 3000) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.lastCorrectTime = now;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        this.createParticles(centerX, centerY, this.hslToString(this.differentColor));
        
        if (this.combo >= 3) {
            this.createComboEffect(centerX, centerY);
            this.playSound('combo');
            this.createScreenFlash('#ffd700');
        } else {
            this.playSound('correct');
        }
        
        if (this.level % 5 === 0) {
            this.playSound('levelUp');
            this.createLevelUpEffect();
        }
        
        const timeTaken = (Date.now() - this.startTime) / 1000;
        const timeBonus = Math.max(0, 10 - timeTaken) * 10;
        const levelBonus = this.level * 50;
        const comboBonus = this.combo >= 3 ? this.combo * 30 : 0;
        const points = Math.floor(100 + timeBonus + levelBonus + comboBonus);
        
        this.score += points;
        this.level++;
        
        this.showScorePopup(centerX, centerY, `+${points}`);
        
        if (this.combo >= 3) {
            this.hintText.textContent = `🔥 ${this.combo}连击！+${points} 分！`;
            this.hintText.style.color = '#ffd700';
        } else {
            this.hintText.textContent = `+${points} 分！`;
            this.hintText.style.color = '#4ecdc4';
        }
        
        this.updateDisplay();
        this.updateCombo();
        
        const delay = this.combo >= 3 ? 400 : 300;
        setTimeout(() => {
            this.hintText.textContent = '点击你认为不同的色块';
            this.hintText.style.color = 'rgba(255, 255, 255, 0.8)';
            this.generateLevel();
        }, delay);
    }
    
    handleWrong(block) {
        block.classList.add('wrong');
        this.lives--;
        this.combo = 0;
        this.updateLives();
        this.updateCombo();
        
        this.playSound('wrong');
        
        const rect = block.getBoundingClientRect();
        this.createWrongParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        this.createScreenShake();
        
        this.hintText.textContent = '错了！再试一次';
        this.hintText.style.color = '#ff6b6b';
        
        if (this.lives <= 0) {
            setTimeout(() => this.gameOver(), 400);
        } else {
            setTimeout(() => {
                this.hintText.textContent = '点击你认为不同的色块';
                this.hintText.style.color = 'rgba(255, 255, 255, 0.8)';
            }, 800);
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        this.playSound('gameOver');
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('colorChallengeBest', this.bestScore.toString());
            this.updateBestScore();
            this.messageTitle.textContent = '新纪录！';
        } else {
            this.messageTitle.textContent = '游戏结束';
        }
        
        this.messageText.textContent = `最终得分: ${this.score} | 到达关卡: ${this.level}`;
        this.message.classList.add('show');
    }
    
    updateDisplay() {
        this.levelDisplay.textContent = this.level;
        this.scoreDisplay.textContent = this.score;
    }
    
    updateBestScore() {
        this.bestDisplay.textContent = this.bestScore;
    }
    
    updateLives() {
        const hearts = this.livesContainer.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index >= this.lives) {
                heart.classList.add('lost');
            } else {
                heart.classList.remove('lost');
            }
        });
    }
    
    updateDifficulty() {
        const maxLevel = 50;
        const difficulty = Math.min((this.level / maxLevel) * 100, 100);
        this.difficultyFill.style.width = `${difficulty}%`;
    }
    
    updateCombo() {
        if (this.comboDisplay) {
            this.comboDisplay.textContent = this.combo > 0 ? `${this.combo}x` : '';
            this.comboDisplay.style.opacity = this.combo >= 3 ? '1' : '0';
        }
    }
    
    createParticles(x, y, color) {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            const size = 4 + Math.random() * 6;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                alpha: 1,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    createWrongParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: '#ff6b6b',
                alpha: 1,
                life: 1,
                decay: 0.03
            });
        }
    }
    
    createComboEffect(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 8,
                color: ['#ffd700', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 3)],
                alpha: 1,
                life: 1,
                decay: 0.015
            });
        }
    }
    
    showScorePopup(x, y, text) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 24px;
            font-weight: 700;
            color: #4ecdc4;
            pointer-events: none;
            z-index: 1001;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            transform: translate(-50%, -50%);
            animation: scoreFloat 0.8s ease-out forwards;
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 800);
    }
    
    createScreenFlash(color) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            pointer-events: none;
            z-index: 999;
            opacity: 0.3;
            animation: flashFade 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    }
    
    createScreenShake() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.animation = 'shake 0.3s ease-out';
            setTimeout(() => {
                gameContainer.style.animation = '';
            }, 300);
        }
    }
    
    createLevelUpEffect() {
        const levelUp = document.createElement('div');
        levelUp.textContent = `关卡 ${this.level}`;
        levelUp.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 0 30px rgba(78, 205, 196, 0.8);
            pointer-events: none;
            z-index: 1002;
            animation: levelUpPop 0.8s ease-out forwards;
        `;
        document.body.appendChild(levelUp);
        setTimeout(() => levelUp.remove(), 800);
    }
    
    animateParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            p.alpha = p.life;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.particleCtx.beginPath();
            this.particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.particleCtx.fillStyle = p.color;
            this.particleCtx.globalAlpha = p.alpha;
            this.particleCtx.fill();
        }
        
        this.particleCtx.globalAlpha = 1;
        
        requestAnimationFrame(() => this.animateParticles());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ColorChallengeGame();
});
