const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = 'user-top-read';

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function redirectToSpotifyAuth(): Promise<void> {
  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier).then(base64encode);

  localStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string): Promise<string> {
  const verifier = localStorage.getItem('spotify_code_verifier');
  if (!verifier) {
    throw new Error('Code verifier not found');
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  };

  const response = await fetch('https://accounts.spotify.com/api/token', payload);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to fetch token');
  }

  localStorage.removeItem('spotify_code_verifier');
  return data.access_token;
}

export async function fetchTopArtists(token: string, timeRange: string = 'short_term') {
  // ★ブロックされない安全なAPIのまま、取得数を限界の50件に引き上げ！
  const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch top artists');
  return response.json();
}

export async function fetchTopTracks(token: string, timeRange: string = 'short_term') {
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch top tracks');
  return response.json();
}