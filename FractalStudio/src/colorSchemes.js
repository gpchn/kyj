const COLOR_SCHEMES = {
    cosmic: {
        name: 'Cosmic',
        getColor: (t) => {
            const h = Utils.lerp(0.7, 0.9, t);
            const s = Utils.lerp(0.8, 1, t);
            const l = Utils.lerp(0.1, 0.6, Math.pow(t, 0.5));
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    fire: {
        name: 'Fire',
        getColor: (t) => {
            const h = Utils.lerp(0, 0.12, t);
            const s = Utils.lerp(0.9, 1, t);
            const l = Utils.lerp(0.1, 0.6, Math.pow(t, 0.7));
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    ocean: {
        name: 'Ocean',
        getColor: (t) => {
            const h = Utils.lerp(0.5, 0.6, t);
            const s = Utils.lerp(0.7, 0.9, t);
            const l = Utils.lerp(0.1, 0.5, Math.pow(t, 0.6));
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    forest: {
        name: 'Forest',
        getColor: (t) => {
            const h = Utils.lerp(0.25, 0.4, t);
            const s = Utils.lerp(0.6, 0.9, t);
            const l = Utils.lerp(0.1, 0.5, Math.pow(t, 0.5));
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    grayscale: {
        name: 'Grayscale',
        getColor: (t) => {
            const v = Math.floor(t * 255);
            return { r: v, g: v, b: v };
        }
    },
    
    rainbow: {
        name: 'Rainbow',
        getColor: (t) => {
            const h = t;
            const s = 0.8;
            const l = 0.5;
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    neon: {
        name: 'Neon',
        getColor: (t) => {
            const h = Utils.lerp(0.8, 0.5, Math.sin(t * Math.PI * 2) * 0.5 + 0.5);
            const s = 1;
            const l = Utils.lerp(0.2, 0.7, t);
            return Utils.hslToRgb(h, s, l);
        }
    },
    
    sunset: {
        name: 'Sunset',
        getColor: (t) => {
            const h = Utils.lerp(0.7, 0.05, t);
            const s = Utils.lerp(0.8, 1, t);
            const l = Utils.lerp(0.15, 0.6, Math.pow(t, 0.6));
            return Utils.hslToRgb(h, s, l);
        }
    }
};
