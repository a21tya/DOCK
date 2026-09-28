// Browser storage may be disabled, full, or contain data from an older release.
export function readStored(key, fallback, valid = () => true) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value !== null && valid(value) ? value : fallback;
  } catch { return fallback; }
}
export function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export const validList = value => typeof value?.text === 'string' && Array.isArray(value.items) && value.items.every(x => typeof x === 'string') && Array.isArray(value.checked) && value.checked.every(Number.isInteger);
export const validReminders = value => Array.isArray(value) && value.every(x => typeof x?.label === 'string' && Number.isFinite(x.when) && Number.isFinite(x.id));
export const validActivity = value => Array.isArray(value) && value.every(x => typeof x?.id === 'string' && typeof x.title === 'string' && (x.type !== 'trip' || [x.start,x.end].every(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))) && (x.type !== 'timer' || Number.isFinite(x.remaining)));
