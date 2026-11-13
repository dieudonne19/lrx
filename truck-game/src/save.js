// Progress stored in localStorage (kept by the Android WebView between launches).
const KEY = 'camion-express-save-v1';

export const DEFAULT_SAVE = {
  money: 3000,
  engineLevel: 0,
  tankLevel: 0,
  color: 0xd23c2f,
  fuel: 120,
  damage: 0,
  deliveries: 0,
  earned: 0,
  distance: 0,
  clock: 8 * 60, // minutes since midnight
  town: 'rivebelle',
  tilt: false,
  tiltInvert: false,
  sound: true,
  job: null,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: the game keeps running without saving.
  }
}

export function resetSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
