const SEASON_THEMES = {
    spring: {
        name: '春',
        nameEn: 'Spring',
        primaryInk: '#4a4a4a',
        accentColors: ['#ffb7c5', '#ffd4db', '#ff8fa3', '#c9a0dc'],
        leafColors: ['#90b77d', '#7cb076', '#a8d08d'],
        flowerColors: ['#ffb7c5', '#ff8fa3', '#ffd4db', '#f8b4c4'],
        branchColors: ['#5d4e37', '#6b5b45', '#7a6a55'],
        description: '桃花春色暖先开',
        atmosphere: 'warm'
    },
    summer: {
        name: '夏',
        nameEn: 'Summer',
        primaryInk: '#2d5a27',
        accentColors: ['#4a7c43', '#1e3d1a', '#6b8e23'],
        leafColors: ['#2d5a27', '#3d7a37', '#4a8c43', '#5d9e56'],
        flowerColors: ['#ff6b6b', '#ff8787', '#ffa3a3'],
        branchColors: ['#3d2b1f', '#4a3628', '#574231'],
        description: '接天莲叶无穷碧',
        atmosphere: 'lush'
    },
    autumn: {
        name: '秋',
        nameEn: 'Autumn',
        primaryInk: '#8b4513',
        accentColors: ['#c41e3a', '#d64d5f', '#8b1528', '#d4a574'],
        leafColors: ['#c41e3a', '#d64d5f', '#e67e22', '#d4a574'],
        flowerColors: ['#c41e3a', '#d64d5f', '#e74c3c'],
        branchColors: ['#4a3728', '#5d4738', '#6b5545'],
        description: '霜叶红于二月花',
        atmosphere: 'melancholy'
    },
    winter: {
        name: '冬',
        nameEn: 'Winter',
        primaryInk: '#2a2a2a',
        accentColors: ['#d4d4d8', '#e8e8ec', '#a0a0a8', '#71717a'],
        leafColors: ['#6b7280', '#9ca3af'],
        flowerColors: ['#f5f5f0', '#e8e8ec', '#d4d4d8'],
        branchColors: ['#1f1f1f', '#2a2a2a', '#3d3d3d'],
        description: '白雪纷纷何所似',
        atmosphere: 'serene'
    }
};

const INK_LEVELS = {
    heavy: { name: '焦墨', color: '#1a1a1a', opacity: 1.0 },
    dark: { name: '浓墨', color: '#2a2a2a', opacity: 0.95 },
    medium: { name: '重墨', color: '#3a3a3a', opacity: 0.85 },
    light: { name: '淡墨', color: '#5a5a5a', opacity: 0.7 },
    pale: { name: '清墨', color: '#7a7a7a', opacity: 0.5 }
};

const BRUSH_TYPES = {
    ink: {
        name: '水墨',
        description: '传统水墨笔触',
        hasPressure: true,
        hasSpread: true
    },
    splash: {
        name: '晕染',
        description: '水墨晕染效果',
        hasPressure: false,
        hasSpread: true
    },
    flower: {
        name: '花卉',
        description: '季节性花卉',
        hasPressure: false,
        hasSpread: false
    },
    leaf: {
        name: '叶片',
        description: '季节性叶片',
        hasPressure: false,
        hasSpread: false
    }
};

const BASIC_COLORS = [
    { name: '墨黑', hex: '#1a1a1a', category: 'ink' },
    { name: '焦墨', hex: '#2a2a2a', category: 'ink' },
    { name: '浓墨', hex: '#3a3a3a', category: 'ink' },
    { name: '淡墨', hex: '#5a5a5a', category: 'ink' },
    { name: '赭石', hex: '#8b4513', category: 'earth' },
    { name: '朱砂', hex: '#c41e3a', category: 'red' },
    { name: '胭脂', hex: '#9b2335', category: 'red' },
    { name: '花青', hex: '#2d5a27', category: 'blue' },
    { name: '藤黄', hex: '#d4a574', category: 'yellow' },
    { name: '石青', hex: '#1e3d1a', category: 'blue' }
];

class SeasonThemes {
    constructor() {
        this.currentSeason = 'spring';
        this.currentBrush = 'ink';
        this.currentColor = BASIC_COLORS[0].hex;
        this.useCustomColor = false;
    }
    
    setSeason(season) {
        if (SEASON_THEMES[season]) {
            this.currentSeason = season;
            return SEASON_THEMES[season];
        }
        return null;
    }
    
    setBrush(brush) {
        if (BRUSH_TYPES[brush]) {
            this.currentBrush = brush;
            return BRUSH_TYPES[brush];
        }
        return null;
    }
    
    setColor(hex) {
        this.currentColor = hex;
        this.useCustomColor = true;
    }
    
    resetToInkColor() {
        this.useCustomColor = false;
    }
    
    getCurrentTheme() {
        return SEASON_THEMES[this.currentSeason];
    }
    
    getCurrentBrush() {
        return BRUSH_TYPES[this.currentBrush];
    }
    
    getInkColor(density) {
        if (this.useCustomColor) {
            return {
                color: this.currentColor,
                opacity: 0.85
            };
        }
        
        if (density > 90) return INK_LEVELS.heavy;
        if (density > 70) return INK_LEVELS.dark;
        if (density > 50) return INK_LEVELS.medium;
        if (density > 30) return INK_LEVELS.light;
        return INK_LEVELS.pale;
    }
    
    getAccentColor() {
        const theme = this.getCurrentTheme();
        const colors = theme.accentColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getFlowerColor() {
        if (this.useCustomColor) {
            return this.currentColor;
        }
        const theme = this.getCurrentTheme();
        const colors = theme.flowerColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getLeafColor() {
        if (this.useCustomColor) {
            return this.currentColor;
        }
        const theme = this.getCurrentTheme();
        const colors = theme.leafColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getBranchColor() {
        if (this.useCustomColor) {
            return this.currentColor;
        }
        const theme = this.getCurrentTheme();
        const colors = theme.branchColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getBasicColors() {
        return BASIC_COLORS;
    }
}
