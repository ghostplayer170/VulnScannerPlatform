const axios = require('axios');
const SONARQUBE_URL = process.env.SONARQUBE_URL;
const SONARQUBE_TOKEN = process.env.SONARQUBE_TOKEN;
const authHeader = 'Basic ' + Buffer.from(`${process.env.SONARQUBE_USER}:${process.env.SONARQUBE_PASS}`).toString('base64');
const qs = require('qs'); // para convertir objetos a x-www-form-urlencoded

async function createSonarProject(projectKey, projectName) {
  try {
    const data = qs.stringify({
      project: projectKey,
      name: projectName
    });

    const res = await axios.post(`${SONARQUBE_URL}/api/projects/create`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      }
    });

    if (res.status !== 200) {
      return { status: 'error', message: 'No se pudo crear el proyecto en SonarQube' };
    }

    return { status: 'success', message: 'Proyecto creado correctamente en SonarQube' };
  } catch (err) {
    console.error('Error creando proyecto en SonarQube:', err.response?.data || err.message);
    throw new Error('Error al crear proyecto en SonarQube');
  }
}

async function validateSonarToken() {
  try {
    const res = await axios.get(`${SONARQUBE_URL}/api/authentication/validate`, {
      headers: { Authorization: authHeader }
    });
    return res.data.valid;
  } catch (err) {
    console.error('Error validando token de SonarQube:', err.response?.data || err.message);
    throw new Error('Token de SonarQube inválido');
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

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function runSonarScanner(projectKey, code, language) {

  // Validar token de SonarQube
  const isValidToken = await validateSonarToken();
  if (!isValidToken) {
    throw new Error('Token de SonarQube inválido');
  }

  if (!projectKey || !code || !language) {
    throw new Error('Faltan parámetros necesarios: projectKey, code y language son obligatorios');
  }
  // Nueva ruta dentro del contenedor
  const baseDir = path.resolve(__dirname, '..', 'tasks');
  const projectDir = path.join(baseDir, projectKey);

  fs.mkdirSync(projectDir, { recursive: true });

  fs.writeFileSync(path.join(projectDir, 'source_code.' + language), code);

  const sonarProperties = `
sonar.projectKey=${projectKey}
sonar.sources=.
sonar.host.url=${SONARQUBE_URL}
sonar.login=${SONARQUBE_TOKEN}
  `.trim();

  fs.writeFileSync(path.join(projectDir, 'sonar-project.properties'), sonarProperties);

  const command = `sonar-scanner -Dsonar.projectBaseDir=${projectDir}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log('STDOUT:\n', stdout);
      console.error('STDERR:\n', stderr);

      try {
        fs.rmSync(projectDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Error al eliminar el directorio temporal:', cleanupError.message);
      }

      if (error) {
        return reject(new Error(stderr || error.message));
      }

      resolve(stdout);
    });
  });
}

module.exports = { createSonarProject, getProjectMetrics, runSonarScanner };
