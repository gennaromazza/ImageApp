// Base URL per l'applicazione
export const BASE_URL = import.meta.env.DEV ? '' : '/carnival2025';

// Base URL per le API
export const API_URL = `${BASE_URL}/api`;

// Base URL per gli upload
export const UPLOADS_URL = `${BASE_URL}/uploads`;

// Funzione per generare URL completi
export const getFullUrl = (path: string) => {
  return `${window.location.origin}${BASE_URL}${path}`;
};

// Funzione per generare URL API
export const getApiUrl = (endpoint: string) => {
  return `${API_URL}/${endpoint}`;
};

// Funzione per generare URL upload
export const getUploadUrl = (path: string) => {
  return `${UPLOADS_URL}/${path}`;
};