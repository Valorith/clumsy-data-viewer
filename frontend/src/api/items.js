import config from '../config';

const REQUEST_TIMEOUT_MS = 10000;

function buildUrl(path, params = {}) {
  const url = new URL(`${config.API_BASE_URL}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });

  return url.toString();
}

async function requestJson(path, params) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path, params), {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `Request failed with status ${response.status}`);
      error.response = { data, status: response.status };
      throw error;
    }

    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default {
  async getItems(params = {}) {
    return requestJson('/items', params);
  },

  async getItem(id) {
    return requestJson(`/items/${id}`);
  },

  async getStats() {
    return requestJson('/stats');
  }
};
