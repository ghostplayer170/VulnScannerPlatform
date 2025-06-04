export const BASE_URL = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function checkServerStatus() {
  const res = await fetch(`${BASE_URL}/sonarqube/status`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  const data = await res.json();
  return data.status !== 'UP' ? { status: 'unavailable' } : { status: 'available' };
}

export async function fetchExistingProjects() {
  const res = await fetch(`${BASE_URL}/sonarqube/projects`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  const data = await res.json();
  return data.components || [];
}

export async function sendAnalysisRequest({ code, projectKey, projectName, language }) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...getAuthHeaders(),
    body: JSON.stringify({ code, projectKey, projectName, language })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
