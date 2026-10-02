// Audio & Notification Alerts for Tablewave Live Orders
// Uses standard Web Audio API for zero-dependency, reliable bell chime

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('tablewave-sound-alerts');
    if (saved !== null) soundEnabled = saved === 'true';
  } catch {}

  const unlockAudio = () => {
    initAudioContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

export function isSoundAlertsEnabled(): boolean {
  return soundEnabled;
}

export function setSoundAlertsEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tablewave-sound-alerts', enabled ? 'true' : 'false');
    } catch {}
  }
}

export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
  } catch (err) {
    console.debug('[AudioContext Init Error]:', err);
  }
  return audioCtx;
}

/**
 * Plays a warm, melodic 3-tone restaurant order chime:
 * Tone 1: 587.33 Hz (D5)
 * Tone 2: 880.00 Hz (A5)
 * Tone 3: 1174.66 Hz (D6)
 */
export function playOrderChime(): void {
  if (!soundEnabled) return;
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // Harmonious ascending chime
    const notes = [
      { freq: 587.33, start: 0, duration: 0.18, gain: 0.22 },
      { freq: 880.0, start: 0.13, duration: 0.22, gain: 0.28 },
      { freq: 1174.66, start: 0.28, duration: 0.48, gain: 0.32 },
    ];

    notes.forEach(({ freq, start, duration, gain: targetGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  } catch (err) {
    console.debug('[Chime Alert Error]:', err);
  }
}

/**
 * Flash page title to notify tab when in background
 */
let titleTimer: any = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'Tablewave';

export function flashDocumentTitle(message: string = '🔔 New Order!'): void {
  if (typeof document === 'undefined') return;
  if (!originalTitle || originalTitle.includes('🔔')) {
    originalTitle = 'Tablewave - QR Ordering & Kitchen Platform';
  }

  if (titleTimer) clearInterval(titleTimer);

  let showMsg = true;
  let count = 0;
  titleTimer = setInterval(() => {
    document.title = showMsg ? `${message} | Tablewave` : originalTitle;
    showMsg = !showMsg;
    count++;
    if (count > 10) {
      clearInterval(titleTimer);
      titleTimer = null;
      document.title = originalTitle;
    }
  }, 1000);
}
