/**
 * Sound utility for KDS notifications.
 * - New order: browser-generated chime tone (Web Audio API)
 * - Overdue alert: custom alarm file (/sounds/kds-alarm.wav)
 */

// ============================================================
// NEW ORDER SOUND — Browser-generated chime (Web Audio API)
// ============================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a pleasant chime tone when a new order arrives
 */
export function playNewOrderSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    // Two-note chime: A5 → C#6
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108, ctx.currentTime + 0.15); // C#6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio not available, silently fail
  }
}

// ============================================================
// OVERDUE ALERT SOUND — Custom alarm file (.wav)
// ============================================================

let alarmAudio: HTMLAudioElement | null = null;

function getAlarmAudio(): HTMLAudioElement {
  if (!alarmAudio) {
    alarmAudio = new Audio('/sounds/kds-alarm.wav');
    alarmAudio.volume = 0.8;
  }
  return alarmAudio;
}

/**
 * Play the alarm sound for overdue orders (> 5 minutes waiting)
 */
export function playAlertSound() {
  try {
    const audio = getAlarmAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser may block autoplay until user interaction
    });
  } catch (e) {
    // Audio not available
  }
}
