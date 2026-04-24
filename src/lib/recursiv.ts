import { Recursiv } from '@recursiv/sdk';

// Server-only SDK singleton.
// The API key is read from RECURSIV_API_KEY automatically.
// NEVER import this file from client components.

let _client: Recursiv | null = null;

export function getRecursiv(): Recursiv {
  if (!_client) {
    _client = new Recursiv({
      // If the key is missing, allow construction so the app still boots.
      // Any actual SDK call will fail with a clear error until the key is set.
      ...(!process.env.RECURSIV_API_KEY && { allowNoKey: true }),
      ...(process.env.RECURSIV_API_BASE_URL && { baseUrl: process.env.RECURSIV_API_BASE_URL }),
    });
  }
  return _client;
}

export function hasRecursivKey(): boolean {
  return Boolean(process.env.RECURSIV_API_KEY);
}
