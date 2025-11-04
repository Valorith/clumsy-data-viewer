const fallbackHost = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.host}`
  : 'http://localhost:3001';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || `${fallbackHost}${fallbackHost.endsWith('/') ? '' : ''}/api`;

export default {
  API_BASE_URL,
  ALLA_BASE_URL: 'https://alla.clumsysworld.com/?a=item&id=',
  DEFAULT_PAGE_SIZE: 50,
  DEBOUNCE_DELAY: 300
};
