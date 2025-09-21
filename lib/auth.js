import crypto from 'crypto';
import { ADMIN_PASSWORD, ADMIN_USERNAME, API_TOKEN } from './settings';

export const SESSION_COOKIE_NAME = 'session';

export function verifyCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function getSessionToken() {
  const hash = crypto.createHash('sha256');
  hash.update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`);
  return hash.digest('hex');
}

export function isValidSession(token) {
  return token === getSessionToken();
}

export function getApiToken() {
  return API_TOKEN;
}
