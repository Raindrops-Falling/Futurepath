// Cookie utility functions for anonymous user tracking

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function setCookie(name: string, value: string, days: number = 365) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getOrCreateAnonymousId(): string {
  const existingId = getCookie('futurepath_anon_id');
  if (existingId) {
    return existingId;
  }
  
  // Create a new anonymous ID
  const newId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  setCookie('futurepath_anon_id', newId, 365);
  return newId;
}

export function clearAnonymousCookie() {
  document.cookie = 'futurepath_anon_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
