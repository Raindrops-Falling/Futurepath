import { supabase } from '../lib/supabase';

// Helper to manage a single persistent anon id per device and to make requests
export async function getOrCreateAnonId(): Promise<string | null> {
  try {
    const existing = localStorage.getItem('anon_id');
    if (existing) return existing;

    const { projectId } = await import('../../utils/supabase/info');
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/anon-start`, { method: 'POST' });
    if (!res.ok) return null;

    // Prefer header if present, else body
    const headerAnon = res.headers.get('x-anon-id');
    if (headerAnon) {
      localStorage.setItem('anon_id', headerAnon);
      return headerAnon;
    }

    const d = await res.json();
    if (d?.anon_id) {
      localStorage.setItem('anon_id', d.anon_id);
      return d.anon_id;
    }
    return null;
  } catch (err) {
    console.error('Error creating anon id:', err);
    return null;
  }
}

export async function fetchWithAuthOrAnon(input: RequestInfo, init: RequestInit = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = new Headers(init.headers || {});
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    } else {
      // Fast-path: read localStorage synchronously so header is attached immediately if present
      try {
        const existing = localStorage.getItem('anon_id');
        if (existing) {
          headers.set('x-anon-id', existing);
        } else {
          const anonId = await getOrCreateAnonId();
          if (anonId) headers.set('x-anon-id', anonId);
        }
      } catch (e) {
        const anonId = await getOrCreateAnonId();
        if (anonId) headers.set('x-anon-id', anonId);
      }
    }
    const resp = await fetch(input, { ...init, headers });

    // If server returned an anon id in header (resolveActor), persist it locally
    try {
      const returnedAnon = resp.headers.get('x-anon-id');
      if (returnedAnon) localStorage.setItem('anon_id', returnedAnon);
    } catch (e) {
      // ignore storage errors
    }

    return resp;
  } catch (err) {
    console.error('fetchWithAuthOrAnon error:', err);
    return fetch(input, init);
  }
}
