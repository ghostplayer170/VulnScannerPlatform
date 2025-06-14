import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import qs from 'qs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SONARQUBE_URL = process.env.SONARQUBE_URL;
const SONARQUBE_TOKEN = process.env.SONARQUBE_TOKEN;
const authHeader = 'Basic ' + Buffer.from(`${process.env.SONARQUBE_USER}:${process.env.SONARQUBE_PASS}`).toString('base64');

// Crea un nuevo proyecto en SonarQube
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

// Ejecuta Sonar Scanner para analizar el código fuente
async function runSonarScanner(projectKey, code, language) {

  const isValidToken = await validateSonarToken();
  if (!isValidToken) throw new Error('Token de SonarQube inválido');
  if (!projectKey || !code || !language) throw new Error('Faltan parámetros necesarios: projectKey, code y language son obligatorios');

  const baseDir = path.resolve(__dirname, '..', 'tasks'); // Define el directorio base para los proyectos
  const projectDir = path.join(baseDir, projectKey); // Define el directorio del proyecto basado en su clave
  fs.mkdirSync(projectDir, { recursive: true }); // Crea el directorio del proyecto si no existe
  fs.writeFileSync(path.join(projectDir, 'source_code_' + projectKey + '.' + language), code); // Guarda el código fuente en un archivo
  // Crea el archivo de configuración sonar-project.properties
  const sonarProperties = `
  sonar.projectKey=${projectKey}
  sonar.sources=.
  sonar.host.url=${SONARQUBE_URL}
  sonar.login=${SONARQUBE_TOKEN}
  `.trim();

  // Escribe las propiedades de SonarQube en el archivo sonar-project.properties
  fs.writeFileSync(path.join(projectDir, 'sonar-project.properties'), sonarProperties);
  // Configura el comando para ejecutar Sonar Scanner
  const command = `sonar-scanner -Dsonar.projectBaseDir=${projectDir}`;
  try {
    // Ejecuta el comando de Sonar Scanner
    const execResult = new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        console.log('STDOUT:\n', stdout);
        console.error('STDERR:\n', stderr);
        try {
          // Limpia el directorio del proyecto después de ejecutar Sonar Scanner
          fs.rmSync(projectDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Error al eliminar el directorio temporal:', cleanupError.message);
          if (error) return reject(new Error(stderr || error.message));
          resolve(stdout);
        }
      });
    });
    const result = await execResult;
    if (!result) throw new Error('No se obtuvo resultado del análisis de Sonar Scanner');
    // Espera a que SonarQube complete el análisis
    await waitForAnalysisCompletion(projectKey);
  }
  catch (err) {
    console.error('Error ejecutando Sonar Scanner:', err.message);
    throw new Error('Error al ejecutar Sonar Scanner');
  }
  // Obtiene los resultados del análisis
  return await getAnalysisResults(projectKey);
}

// Devuelve la solución para un problema específico basado en su clave de regla
async function getSolutionForIssue(ruleKey) {
  try {
    const res = await axios.get(`${SONARQUBE_URL}/api/rules/search?rule_key=${ruleKey}`, {
      headers: { Authorization: authHeader }
    });
    const rule = res.data.rules?.[0];
    return rule?.htmlDesc || '<p>Solución no disponible.</p>';
  } catch (err) {
    console.error(`Error obteniendo la regla ${ruleKey}:`, err.message);
    return '<p>Error al obtener la solución.</p>';
  }
}

// Espera a que SonarQube complete el análisis del proyecto
async function waitForAnalysisCompletion(projectKey, timeoutMs = 10000, intervalMs = 1000) {
  const startTime = Date.now();
  // Mientras el tiempo transcurrido sea menor que el timeout
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await axios.get(`${SONARQUBE_URL}/api/ce/component?component=${projectKey}`, {
        headers: { Authorization: authHeader }
      });
      const task = res.data.queue?.[0] || res.data.current;
      const status = task?.status;
      if (status === 'SUCCESS') return true;
      console.log(`Esperando análisis de SonarQube para ${projectKey}... Status actual: ${status}`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (err) {
      console.warn('Error al consultar el estado del análisis:', err.message);
    }
  }

  throw new Error('Timeout esperando que SonarQube finalice el análisis');
}

// Obtiene los resultados del análisis de SonarQube para un proyecto específico
async function getAnalysisResults(projectKey) {
  const res = await axios.get(`${SONARQUBE_URL}/api/issues/search`, {
    headers: { Authorization: authHeader }
  });
  if (res.status !== 200) throw new Error('Error al obtener resultados del análisis');
  const issues = res.data.issues.filter(issue => issue.component.startsWith(`${projectKey}:`));
  const uniqueRuleKeys = [...new Set(issues.map(issue => issue.rule))];
  const rulesMap = {};
  await Promise.all(
    uniqueRuleKeys.map(async (ruleKey) => {
      const htmlDesc = await getSolutionForIssue(ruleKey);
      console.log(`Regla ${ruleKey} procesada:`, htmlDesc);
      rulesMap[ruleKey] = htmlDesc;
    })
  );
  const issuesWithSolutions = issues.map(issue => ({
    ...issue,
    solutionHtml: rulesMap[issue.rule] || '<p>Sin solución disponible</p>'
  }));
  return issuesWithSolutions;
}

// Obtiene los lenguajes soportados por SonarQube
async function getSupportedLanguages() {
  try {
    const res = await axios.get(`${SONARQUBE_URL}/api/languages/list`, {
      headers: { Authorization: authHeader }
    });
    return res.data || [];
  } catch (err) {
    console.error('Error obteniendo lenguajes soportados:', err.message);
    throw new Error('No se pudieron obtener los lenguajes soportados');
  }
}

// Valida el token de SonarQube para asegurarse de que es válido
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

// Obtiene el estado del servidor SonarQube
async function getServerStatus() {
  try {
    const res = await axios.get(`${SONARQUBE_URL}/api/system/status`);
    return res.data || { "status": "UNKNOWN" };
  } catch (err) {
    console.error('Error obteniendo estado de SonarQube:', err);
    throw new Error('No se pudo obtener el estado de SonarQube');
  }
}

export { createSonarProject, validateSonarToken, runSonarScanner, getAnalysisResults, getSupportedLanguages, getServerStatus };
