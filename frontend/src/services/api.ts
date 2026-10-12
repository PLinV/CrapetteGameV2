// L'API est servie sur le même domaine que le front, sous /api.
export const API_URL = '/api';

// fetch avec les cookies d'auth. Si l'access token a expiré (401), on tente un
// /refresh puis on rejoue la requête une fois.
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

  const response = await send();
  if (response.status !== 401) return response;

  const refresh = await fetch(`${API_URL}/refresh`, { method: 'POST' });
  return refresh.ok ? send() : response;
}
