// L'API est servie sur le même domaine que le front, sous /api.
export const API_URL = '/api';

// Le refresh token est à usage unique : les requêtes qui expirent en même temps
// partagent le même /refresh, sinon la deuxième échouerait et déconnecterait le joueur.
let refreshing: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/refresh`, { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

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

  return (await refreshTokens()) ? send() : response;
}
