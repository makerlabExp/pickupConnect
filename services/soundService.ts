
// Lazy initialization of AudioContext
let audioCtx: AudioContext | null = null;
let isMuted = false; // Global mute state

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const resumeCtx = () => {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(e => console.error(e));
  }
  return ctx;
};

export const setSystemMute = (muted: boolean) => {
    isMuted = muted;
};

export const getSystemMute = () => isMuted;

export const playSound = {
  // Subtle click for UI interaction
  click: () => {
    if (isMuted) return;
    try {
      const ctx = resumeCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  },

  // Cheerful ascending chime for success
  success: () => {
    if (isMuted) return;
    try {
      const ctx = resumeCtx();
      const now = ctx.currentTime;
      
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.1));
        gain.gain.setValueAtTime(0.05, now + (i * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 0.3);
        
        osc.start(now + (i * 0.1));
        osc.stop(now + (i * 0.1) + 0.3);
      });
    } catch (e) {}
  },

  // Low buzz for error
  error: () => {
    if (isMuted) return;
    try {
      const ctx = resumeCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  },

  // Pleasant chime for notifications (Student update, Instructor alert)
  notification: () => {
    if (isMuted) return;
    try {
      const ctx = resumeCtx();
      const now = ctx.currentTime;
      
      // Major triad arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { 
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.08));
        
        // Bell-like envelope
        gain.gain.setValueAtTime(0, now + (i * 0.08));
        gain.gain.linearRampToValueAtTime(0.05, now + (i * 0.08) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 0.8);
        
        osc.start(now + (i * 0.08));
        osc.stop(now + (i * 0.08) + 0.8);
      });
    } catch (e) {}
  }
};
