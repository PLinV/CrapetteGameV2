// On définit l'URL de base pour ne pas avoir à l'écrire à chaque fois
const BASE_URL = 'http://localhost:3000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // 1. On force l'inclusion des cookies (credentials) pour toutes les requêtes
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

  // passe pas 
  if (response.status === 401) {
    console.log("access Token expiré, tentative de rafraîchissement");

    const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      console.log("tokens rafraîchis");
      // Si le refresh a marché, on retente EXACTEMENT la même requête qu'au début
      response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    } else {
      console.warn("refresh Token invalide ou expiré");
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
  }

  // On renvoie la réponse finale (qu'elle soit bonne, ou mauvaise si le refresh a échoué)
  return response;
}