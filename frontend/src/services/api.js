const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export async function checkServerStatus() {
  const res = await fetch(`${BASE_URL}/sonarqube/status`);
  return await res.json();
}

export async function fetchExistingProjects() {
  const res = await fetch(`${BASE_URL}/sonarqube/projects`);
  const data = await res.json();
  return data.components || [];
}

export async function sendAnalysisRequest({ code, projectKey, projectName, language }) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, projectKey, projectName, language })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
