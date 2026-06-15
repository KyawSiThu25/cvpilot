const ONE_HOUR_MS = 60 * 60 * 1000;

export function setSessionItem(key: string, value: string) {
  const item = {
    value,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(key, JSON.stringify(item));
}

export function getSessionItem(key: string): string | null {
  const itemStr = sessionStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = Date.now();
    if (now - item.timestamp > ONE_HOUR_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (e) {
    // Fallback if the data wasn't stored with a timestamp
    return itemStr;
  }
}
