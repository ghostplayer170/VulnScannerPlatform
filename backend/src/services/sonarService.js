const axios = require('axios');
const SONARQUBE_URL = process.env.SONARQUBE_URL;
const authHeader = 'Basic ' + Buffer.from(`${process.env.SONARQUBE_USER}:${process.env.SONARQUBE_PASS}`).toString('base64');

async function createSonarProject(projectKey, projectName) {
  try {
    await axios.post(`${SONARQUBE_URL}/api/projects/create`, null, {
      params: { project: projectKey, name: projectName },
      headers: { Authorization: authHeader }
    });
  } catch (err) {
    console.error('Error creando proyecto en SonarQube:', err.response?.data || err.message);
    throw new Error('Error al crear proyecto en SonarQube');
  }
}

async function getProjectMetrics(projectKey) {
  const metrics = 'bugs,vulnerabilities,code_smells,security_rating,reliability_rating';
  const url = `${SONARQUBE_URL}/api/measures/component`;

  try {
    const res = await axios.get(url, {
      params: { component: projectKey, metricKeys: metrics },
      headers: { Authorization: authHeader }
    });
    return res.data;
  } catch (err) {
    console.error('Error obteniendo métricas:', err.response?.data || err.message);
    throw new Error('No se pudo obtener métricas de SonarQube');
  }
}

module.exports = { createSonarProject, getProjectMetrics };
