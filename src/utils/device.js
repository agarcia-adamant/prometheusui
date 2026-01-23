const DEVICE_KEY = 'prometheus_device_id';

export function getDeviceId() {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = `device_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
