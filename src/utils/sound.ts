/**
 * Sound utility for KDS notifications.
 * Uses custom audio file from /sounds/kds-alarm.wav
 */

let alarmAudio: HTMLAudioElement | null = null;

function getAlarmAudio(): HTMLAudioElement {
  if (!alarmAudio) {
    alarmAudio = new Audio('/sounds/kds-alarm.wav');
    alarmAudio.volume = 0.7;
  }
  return alarmAudio;
}

/**
 * Play the KDS alarm sound when a new order arrives
 */
export function playNewOrderSound() {
  try {
    const audio = getAlarmAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser may block autoplay until user interaction
    });
  } catch (e) {
    // Audio not available, silently fail
  }
}

/**
 * Play alert sound for overdue orders (same file, higher volume)
 */
export function playAlertSound() {
  try {
    const audio = getAlarmAudio();
    audio.volume = 1.0;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    // Reset volume after play
    setTimeout(() => { audio.volume = 0.7; }, 1000);
  } catch (e) {
    // Audio not available
  }
}
