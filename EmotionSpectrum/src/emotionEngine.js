class EmotionEngine {
    constructor() {
        this.currentEmotion = 'neutral';
        this.emotionHistory = [];
        this.historyLength = 30;
        this.emotionIntensity = 0;
        this.confidence = 0;
        
        this.emotionWeights = {
            calm: 0,
            happy: 0,
            excited: 0,
            sad: 0,
            angry: 0,
            fearful: 0,
            neutral: 0
        };
        
        this.transitionSpeed = 0.15;
        this.smoothedWeights = { ...this.emotionWeights };
        
        this.onEmotionChange = null;
    }
    
    analyze(audioAnalyzer) {
        const volume = audioAnalyzer.getVolume();
        const frequency = audioAnalyzer.getFrequency();
        const bands = audioAnalyzer.getFrequencyBands();
        const spectralCentroid = audioAnalyzer.spectralCentroid;
        const spectralFlatness = audioAnalyzer.spectralFlatness;
        const zeroCrossingRate = audioAnalyzer.zeroCrossingRate;
        const volumeTrend = audioAnalyzer.getVolumeTrend();
        const energyDistribution = audioAnalyzer.getEnergyDistribution();
        
        this.calculateEmotionWeights(volume, frequency, bands, spectralCentroid, spectralFlatness, zeroCrossingRate, volumeTrend, energyDistribution);
        
        this.smoothWeights();
        
        this.determineCurrentEmotion();
        
        this.emotionIntensity = volume;
        
        this.updateHistory();
        
        return {
            emotion: this.currentEmotion,
            intensity: this.emotionIntensity,
            confidence: this.confidence,
            config: EMOTION_CONFIG[this.currentEmotion]
        };
    }
    
    calculateEmotionWeights(volume, frequency, bands, spectralCentroid, spectralFlatness, zeroCrossingRate, volumeTrend, energyDistribution) {
        this.emotionWeights.neutral = 0.3;
        
        this.emotionWeights.calm = this.calculateCalmWeight(volume, frequency, bands, spectralFlatness);
        this.emotionWeights.happy = this.calculateHappyWeight(volume, frequency, bands, spectralCentroid);
        this.emotionWeights.excited = this.calculateExcitedWeight(volume, frequency, bands, zeroCrossingRate);
        this.emotionWeights.sad = this.calculateSadWeight(volume, frequency, bands, spectralCentroid);
        this.emotionWeights.angry = this.calculateAngryWeight(volume, frequency, bands, zeroCrossingRate);
        this.emotionWeights.fearful = this.calculateFearfulWeight(volume, frequency, bands, spectralFlatness);
        
        const totalWeight = Object.values(this.emotionWeights).reduce((a, b) => a + b, 0);
        if (totalWeight > 0) {
            for (const emotion in this.emotionWeights) {
                this.emotionWeights[emotion] /= totalWeight;
            }
        }
    }
    
    calculateCalmWeight(volume, frequency, bands, spectralFlatness) {
        let weight = 0;
        
        if (volume < 0.3) {
            weight += (0.3 - volume) * 2;
        }
        
        if (bands.bass > bands.treble) {
            weight += 0.3;
        }
        
        if (spectralFlatness > 0.3 && spectralFlatness < 0.6) {
            weight += 0.2;
        }
        
        if (frequency < 500) {
            weight += 0.2;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    calculateHappyWeight(volume, frequency, bands, spectralCentroid) {
        let weight = 0;
        
        if (volume > 0.2 && volume < 0.6) {
            weight += 0.3;
        }
        
        if (frequency > 300 && frequency < 2000) {
            weight += 0.3;
        }
        
        if (bands.mid > bands.bass && bands.mid > bands.treble) {
            weight += 0.2;
        }
        
        if (spectralCentroid > 0.3 && spectralCentroid < 0.6) {
            weight += 0.2;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    calculateExcitedWeight(volume, frequency, bands, zeroCrossingRate) {
        let weight = 0;
        
        if (volume > 0.5) {
            weight += (volume - 0.5) * 1.5;
        }
        
        if (frequency > 1000) {
            weight += 0.3;
        }
        
        if (bands.treble > 0.3) {
            weight += 0.2;
        }
        
        if (zeroCrossingRate > 0.1) {
            weight += 0.2;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    calculateSadWeight(volume, frequency, bands, spectralCentroid) {
        let weight = 0;
        
        if (volume < 0.25 && volume > 0.05) {
            weight += 0.3;
        }
        
        if (frequency < 400) {
            weight += 0.3;
        }
        
        if (bands.bass > bands.mid && bands.bass > bands.treble) {
            weight += 0.2;
        }
        
        if (spectralCentroid < 0.3) {
            weight += 0.2;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    calculateAngryWeight(volume, frequency, bands, zeroCrossingRate) {
        let weight = 0;
        
        if (volume > 0.6) {
            weight += (volume - 0.6) * 2;
        }
        
        if (bands.bass > 0.4 && bands.treble > 0.3) {
            weight += 0.3;
        }
        
        if (zeroCrossingRate > 0.15) {
            weight += 0.2;
        }
        
        if (frequency > 500 && frequency < 1500) {
            weight += 0.2;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    calculateFearfulWeight(volume, frequency, bands, spectralFlatness) {
        let weight = 0;
        
        if (volume > 0.3 && volume < 0.7) {
            weight += 0.2;
        }
        
        if (bands.highMid > bands.mid) {
            weight += 0.3;
        }
        
        if (spectralFlatness > 0.5) {
            weight += 0.2;
        }
        
        if (frequency > 1500) {
            weight += 0.3;
        }
        
        return Utils.clamp(weight, 0, 1);
    }
    
    smoothWeights() {
        for (const emotion in this.emotionWeights) {
            this.smoothedWeights[emotion] = Utils.lerp(
                this.smoothedWeights[emotion],
                this.emotionWeights[emotion],
                this.transitionSpeed
            );
        }
    }
    
    determineCurrentEmotion() {
        let maxWeight = 0;
        let dominantEmotion = 'neutral';
        
        for (const [emotion, weight] of Object.entries(this.smoothedWeights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                dominantEmotion = emotion;
            }
        }
        
        const previousEmotion = this.currentEmotion;
        this.currentEmotion = dominantEmotion;
        this.confidence = maxWeight;
        
        if (previousEmotion !== this.currentEmotion && this.onEmotionChange) {
            this.onEmotionChange(this.currentEmotion, this.confidence);
        }
    }
    
    updateHistory() {
        this.emotionHistory.push({
            emotion: this.currentEmotion,
            intensity: this.emotionIntensity,
            confidence: this.confidence,
            weights: { ...this.smoothedWeights }
        });
        
        if (this.emotionHistory.length > this.historyLength) {
            this.emotionHistory.shift();
        }
    }
    
    getCurrentEmotion() {
        return {
            emotion: this.currentEmotion,
            intensity: this.emotionIntensity,
            confidence: this.confidence,
            config: EMOTION_CONFIG[this.currentEmotion]
        };
    }
    
    getEmotionColor() {
        const config = EMOTION_CONFIG[this.currentEmotion];
        const { h, s, l } = config.color;
        const adjustedL = l + (this.emotionIntensity - 0.5) * 20;
        return { h, s, l: Utils.clamp(adjustedL, 20, 80) };
    }
    
    getEmotionColorRgba(alpha = 1) {
        const { h, s, l } = this.getEmotionColor();
        return Utils.hslToRgba(h, s, l, alpha);
    }
    
    getEmotionWeights() {
        return { ...this.smoothedWeights };
    }
    
    getEmotionHistory() {
        return [...this.emotionHistory];
    }
    
    getTransitionProgress() {
        const weights = Object.values(this.smoothedWeights);
        const max = Math.max(...weights);
        const second = weights.sort((a, b) => b - a)[1] || 0;
        return max - second;
    }
    
    getVisualParameters() {
        const config = EMOTION_CONFIG[this.currentEmotion];
        const intensity = this.emotionIntensity;
        
        return {
            style: config.visualStyle,
            particleSpeed: config.particleSpeed * (0.5 + intensity),
            waveAmplitude: config.waveAmplitude * (0.5 + intensity * 1.5),
            color: this.getEmotionColor(),
            intensity: intensity,
            confidence: this.confidence,
            blur: intensity * 10,
            glow: intensity * 20,
            saturation: config.color.s + intensity * 20
        };
    }
}
