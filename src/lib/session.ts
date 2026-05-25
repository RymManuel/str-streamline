import { AuthSession } from '@/types';

const SESSION_KEY = 'str_session';

export const sessionStore = {
  get: (): AuthSession | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (session: AuthSession) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clear: () => localStorage.removeItem(SESSION_KEY),
};
