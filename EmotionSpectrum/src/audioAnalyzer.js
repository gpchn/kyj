class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.timeDataArray = null;
        this.source = null;
        this.stream = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.isActive = false;
        
        this.volume = 0;
        this.smoothedVolume = 0;
        this.frequency = 0;
        this.smoothedFrequency = 0;
        
        this.frequencyBands = {
            bass: 0,
            lowMid: 0,
            mid: 0,
            highMid: 0,
            treble: 0
        };
        
        this.spectralCentroid = 0;
        this.spectralFlatness = 0;
        this.zeroCrossingRate = 0;
        
        this.volumeHistory = [];
        this.frequencyHistory = [];
        this.historyLength = 60;
        
        this.calibrationFactor = 1.0;
        this.ambientNoiseLevel = 0;
        this.calibrationSamples = [];
        this.isCalibrated = false;
        
        this.manualGain = 1.0;
        this.manualCalibrationOffset = 0;
        
        this.onVolumeChange = null;
        this.onFrequencyChange = null;
    }
    
    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.manualGain;
            
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.isInitialized = true;
            this.isActive = true;
            
            await this.calibrate();
            
            return true;
        } catch (error) {
            console.error('音频初始化失败:', error);
            return false;
        }
    }
    
    async calibrate() {
        return new Promise((resolve) => {
            const samples = [];
            let sampleCount = 0;
            const targetSamples = 30;
            
            const collectSample = () => {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                let sum = 0;
                for (let i = 0; i < this.dataArray.length; i++) {
                    sum += this.dataArray[i];
                }
                const avg = sum / this.dataArray.length;
                samples.push(avg);
                
                sampleCount++;
                
                if (sampleCount < targetSamples) {
                    setTimeout(collectSample, 50);
                } else {
                    samples.sort((a, b) => a - b);
                    const medianIndex = Math.floor(samples.length / 2);
                    this.ambientNoiseLevel = samples[medianIndex] / 255;
                    
                    if (this.ambientNoiseLevel > 0.01) {
                        this.calibrationFactor = 1 / (1 - this.ambientNoiseLevel);
                    }
                    
                    this.isCalibrated = true;
                    resolve();
                }
            };
            
            setTimeout(collectSample, 100);
        });
    }
    
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.isActive = false;
        this.isInitialized = false;
    }
    
    analyze() {
        if (!this.isInitialized || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        this.analyser.getByteTimeDomainData(this.timeDataArray);
        
        this.calculateVolume();
        this.calculateFrequency();
        this.calculateFrequencyBands();
        this.calculateSpectralFeatures();
        this.calculateZeroCrossingRate();
        
        this.updateHistory();
    }
    
    calculateVolume() {
        let sum = 0;
        let max = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const value = this.dataArray[i];
            sum += value * value;
            if (value > max) max = value;
        }
        
        const rms = Math.sqrt(sum / this.dataArray.length);
        let normalizedVolume = rms / 255;
        
        normalizedVolume *= this.manualGain;
        
        normalizedVolume += this.manualCalibrationOffset;
        
        if (this.isCalibrated && normalizedVolume > this.ambientNoiseLevel) {
            normalizedVolume = (normalizedVolume - this.ambientNoiseLevel) * this.calibrationFactor;
        } else if (normalizedVolume <= this.ambientNoiseLevel) {
            normalizedVolume = 0;
        }
        
        this.volume = Utils.clamp(normalizedVolume, 0, 1);
        this.smoothedVolume = Utils.lerp(this.smoothedVolume, this.volume, 0.3);
        
        if (this.onVolumeChange) {
            this.onVolumeChange(this.smoothedVolume);
        }
    }
    
    calculateFrequency() {
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        
        const nyquist = this.audioContext.sampleRate / 2;
        this.frequency = (maxIndex / this.dataArray.length) * nyquist;
        this.smoothedFrequency = Utils.lerp(this.smoothedFrequency, this.frequency, 0.2);
        
        if (this.onFrequencyChange) {
            this.onFrequencyChange(this.smoothedFrequency);
        }
    }
    
    calculateFrequencyBands() {
        const bufferLength = this.dataArray.length;
        const nyquist = this.audioContext.sampleRate / 2;
        
        const bandRanges = {
            bass: { min: 20, max: 250 },
            lowMid: { min: 250, max: 500 },
            mid: { min: 500, max: 2000 },
            highMid: { min: 2000, max: 4000 },
            treble: { min: 4000, max: nyquist }
        };
        
        for (const [band, range] of Object.entries(bandRanges)) {
            const minIndex = Math.floor((range.min / nyquist) * bufferLength);
            const maxIndex = Math.floor((range.max / nyquist) * bufferLength);
            
            let sum = 0;
            let count = 0;
            
            for (let i = minIndex; i < maxIndex && i < bufferLength; i++) {
                sum += this.dataArray[i];
                count++;
            }
            
            let bandValue = count > 0 ? (sum / count) / 255 : 0;
            
            if (this.isCalibrated && bandValue > this.ambientNoiseLevel) {
                bandValue = (bandValue - this.ambientNoiseLevel) * this.calibrationFactor;
            }
            
            this.frequencyBands[band] = Utils.clamp(bandValue, 0, 1);
        }
    }
    
    calculateSpectralFeatures() {
        let weightedSum = 0;
        let totalEnergy = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const magnitude = this.dataArray[i];
            weightedSum += i * magnitude;
            totalEnergy += magnitude;
        }
        
        this.spectralCentroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
        
        let geometricMean = 0;
        let arithmeticMean = 0;
        let count = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > 0) {
                geometricMean += Math.log(this.dataArray[i]);
                arithmeticMean += this.dataArray[i];
                count++;
            }
        }
        
        if (count > 0) {
            geometricMean = Math.exp(geometricMean / count);
            arithmeticMean /= count;
            this.spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
        }
    }
    
    calculateZeroCrossingRate() {
        let crossings = 0;
        const threshold = 128;
        
        for (let i = 1; i < this.timeDataArray.length; i++) {
            if ((this.timeDataArray[i - 1] >= threshold && this.timeDataArray[i] < threshold) ||
                (this.timeDataArray[i - 1] < threshold && this.timeDataArray[i] >= threshold)) {
                crossings++;
            }
        }
        
        this.zeroCrossingRate = crossings / this.timeDataArray.length;
    }
    
    updateHistory() {
        this.volumeHistory.push(this.smoothedVolume);
        if (this.volumeHistory.length > this.historyLength) {
            this.volumeHistory.shift();
        }
        
        this.frequencyHistory.push(this.smoothedFrequency);
        if (this.frequencyHistory.length > this.historyLength) {
            this.frequencyHistory.shift();
        }
    }
    
    getVolume() {
        return this.smoothedVolume;
    }
    
    getFrequency() {
        return this.smoothedFrequency;
    }
    
    getFrequencyBands() {
        return this.frequencyBands;
    }
    
    getFrequencyData() {
        return this.dataArray;
    }
    
    getTimeData() {
        return this.timeDataArray;
    }
    
    getVolumeInDb() {
        if (this.smoothedVolume < 0.001) {
            return -60;
        }
        
        const db = 20 * Math.log10(this.smoothedVolume);
        return Math.round(Utils.clamp(db, -60, 0));
    }
    
    getDominantFrequencyHz() {
        return Math.round(this.smoothedFrequency);
    }
    
    getVolumeTrend() {
        if (this.volumeHistory.length < 10) return 'stable';
        
        const recent = this.volumeHistory.slice(-10);
        const older = this.volumeHistory.slice(-20, -10);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
        
        const diff = recentAvg - olderAvg;
        
        if (diff > 0.05) return 'rising';
        if (diff < -0.05) return 'falling';
        return 'stable';
    }
    
    getEnergyDistribution() {
        const { bass, lowMid, mid, highMid, treble } = this.frequencyBands;
        const total = bass + lowMid + mid + highMid + treble;
        
        if (total === 0) {
            return { bass: 0.2, lowMid: 0.2, mid: 0.2, highMid: 0.2, treble: 0.2 };
        }
        
        return {
            bass: bass / total,
            lowMid: lowMid / total,
            mid: mid / total,
            highMid: highMid / total,
            treble: treble / total
        };
    }
    
    setManualGain(gain) {
        this.manualGain = Math.max(0.1, Math.min(10, gain));
        if (this.gainNode) {
            this.gainNode.gain.value = this.manualGain;
        }
    }
    
    setManualCalibrationOffset(offset) {
        this.manualCalibrationOffset = Math.max(-0.5, Math.min(0.5, offset));
    }
    
    calibrateToCurrentLevel() {
        if (!this.isInitialized || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const avg = sum / this.dataArray.length;
        const currentLevel = avg / 255;
        
        this.ambientNoiseLevel = currentLevel * 0.8;
        
        if (this.ambientNoiseLevel < 0.05) {
            this.ambientNoiseLevel = 0.02;
        }
        
        this.calibrationFactor = 1 / (1 - this.ambientNoiseLevel);
        this.isCalibrated = true;
        
        return this.ambientNoiseLevel;
    }
    
    resetCalibration() {
        this.ambientNoiseLevel = 0;
        this.calibrationFactor = 1.0;
        this.manualGain = 1.0;
        this.manualCalibrationOffset = 0;
        this.isCalibrated = false;
        
        if (this.gainNode) {
            this.gainNode.gain.value = 1.0;
        }
    }
}
