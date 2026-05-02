import axios from 'axios';

let baseURL = 'http://localhost:8000/api/v1';

export function setBaseURL(url: string): void {
  baseURL = url;
  api.defaults.baseURL = url;
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12_000,
  withCredentials: false,
});
