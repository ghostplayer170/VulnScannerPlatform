export const BASE_URL = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Get server status
export async function checkServerStatus() {
  const res = await fetch(`${BASE_URL}/sonarqube/status`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  const data = await res.json();
  return data.status !== 'UP' ? { status: 'unavailable' } : { status: 'available' };
}

// Fetch existing projects from the backend
export async function fetchExistingProjects() {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  const data = await res.json();
  return data.projects || [];
}

// Create a new project in the backend
export async function createProject({ projectName }) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name: projectName })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al crear el proyecto');
  }
  const data = await res.json();
  return data.project;
}

// Send analysis request to SonarQube
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
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ code, projectKey, projectName, language })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Guardar resultados del análisis en la base de datos
    if (data.issues && data.issues.length > 0) {
      await postAnalysisResults(projectKey, data.issues);
    }

    return data;
  } catch (error) {
    console.error('Error al enviar solicitud de análisis:', error);
    throw new Error('Error al enviar solicitud de análisis');
  }
}

// Validate token
export const validateToken = async () => {
  const res = await fetch(`${BASE_URL}/auth/validate`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Token inválido');
  const data = await res.json();
  return data.valid;
};

// Get lengauges supported by SonarQube
export const getSupportedLanguages = async () => {
  const res = await fetch(`${BASE_URL}/sonarqube/languages`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Error al obtener lenguajes');
  const data = await res.json();
  return data.languages 
}

// Delete project by key
export const deleteProject = async (projectKey) => {
  const res = await fetch(`${BASE_URL}/projects/${projectKey}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Error al eliminar el proyecto');
  const data = await res.json();
  return data.message || 'Proyecto eliminado correctamente';
}

// Post analysis results
export const postAnalysisResults = async (projectKey, issues) => {
  const res = await fetch(`${BASE_URL}/projects/results/${projectKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ issues })
  });
  if (!res.ok) throw new Error('Error al guardar los resultados del análisis');
  const data = await res.json();
  return data;
}

// Get analysis results by project key
export const getAnalysisResultsForProject = async (projectKey) => {
  const res = await fetch(`${BASE_URL}/projects/results/${projectKey}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Error al obtener los resultados del análisis');
  const data = await res.json();
  return data;
}
