// By default, local development uses Vite's /api proxy to reach FastAPI.
// Set VITE_API_BASE_URL to an absolute backend URL only when overriding it.
const configuredBase = window.PROTHIESE_CONFIG?.clarumApiBaseUrl || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8000');
const API_BASE = configuredBase.replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(
      `Cannot reach the Clarum backend. Start FastAPI on http://127.0.0.1:8000 and refresh this page.`
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (typeof payload.detail === 'string') message = payload.detail;
      else if (payload.detail) message = JSON.stringify(payload.detail);
      else if (payload.message) message = payload.message;
    } catch {
      // Preserve the HTTP status message when the response isn't JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  createRepository: (url) => request('/repositories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }),

  analyzeLearn: (id) => request(`/analyze/learn/${encodeURIComponent(id)}`, { method: 'POST' }),
  analyzeBuild: (id) => request(`/analyze/build/${encodeURIComponent(id)}`, { method: 'POST' }),
  getProject: (id) => request(`/project/${encodeURIComponent(id)}`),
};
