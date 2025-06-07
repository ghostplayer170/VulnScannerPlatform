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
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  const data = await res.json();
  return data.projects || [];
}

export async function createProject({ projectName }) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ name: projectName })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al crear el proyecto');
  }
  const data = await res.json();
  return data.project;
}

export async function sendAnalysisRequest({ code, projectKey, projectName, language }) {

  // Crear proyecto si no existe
  const existingProjects = await fetchExistingProjects();
  if (!existingProjects.some(p => p.key === projectKey)) {
    await createProject({ projectName });
  }

  // Enviar solicitud de análisis
  try {
    const res = await fetch(`${BASE_URL}/sonarqube/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ code, projectKey, projectName, language })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error al enviar solicitud de análisis:', error);
    throw new Error('Error al enviar solicitud de análisis');
  }
}

export const validateToken = async () => {
  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/validate`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Token inválido');
  return res.json();
};
