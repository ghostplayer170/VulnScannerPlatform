require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de SonarQube
const SONARQUBE_URL = process.env.SONARQUBE_URL;
const SONARQUBE_TOKEN = process.env.SONARQUBE_TOKEN;
const TEMP_DIR = path.join(__dirname, 'temp');

// Asegúrate de que el directorio temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Endpoint para verificar si SonarQube está disponible
app.get('/sonarqube/status', async (req, res) => {
  try {
    const url = new URL(`${SONARQUBE_URL}/api/system/status`);
    const response = await axios.get(url.href);
    res.json({ status: 'available', details: response.data });
  } catch (error) {
    console.error('Error conectando con SonarQube:', error.message);
    res.status(500).json({
      status: 'unavailable',
      error: error.message,
      details: 'Verifica que SonarQube esté funcionando y las credenciales sean correctas'
    });
  }
});


// Endpoint para listar proyectos existentes
app.get('/sonarqube/projects', async (req, res) => {
  try {
    
    const response = await axios.get(`${SONARQUBE_URL}/api/projects/search`, {
      headers: { 'Authorization': `Bearer ${SONARQUBE_TOKEN}` },    
    });

  } catch (error) {
    console.error('Error obteniendo proyectos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para recibir y analizar el código
app.post('/analyze', async (req, res) => {
  try {
    const { code, projectKey, projectName, language = 'js' } = req.body;

    if (!code || !projectKey || !projectName) {
      return res.status(400).json({ error: 'Se requieren code, projectKey y projectName' });
    }

    // Logs para depuración
    console.log(`Iniciando análisis para proyecto: ${projectKey}`);
    console.log(`SonarQube URL: ${SONARQUBE_URL}`);

    // Crea un directorio específico para este proyecto
    const projectDir = path.join(TEMP_DIR, projectKey);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Determina la extensión de archivo apropiada
    const fileExtension = getFileExtension(language);
    const filePath = path.join(projectDir, `code.${fileExtension}`);
    
    console.log(`Guardando código en: ${filePath}`);
    fs.writeFileSync(filePath, code);

    // Crea archivo de configuración del scanner para este proyecto
    const sonarPropertiesPath = path.join(projectDir, 'sonar-project.properties');
    const sonarProperties = `
sonar.projectKey=${projectKey}
sonar.projectName=${projectName}
sonar.sources=.
sonar.host.url=${SONARQUBE_URL}
sonar.login=${SONARQUBE_TOKEN}
sonar.sourceEncoding=UTF-8
`;
    fs.writeFileSync(sonarPropertiesPath, sonarProperties);
    console.log('Archivo de propiedades del scanner creado');

    // Verifica si el proyecto ya existe en SonarQube
    const projectExists = await checkIfProjectExists(projectKey);
    
    if (!projectExists) {
      console.log(`El proyecto ${projectKey} no existe. Creándolo...`);
      // Crea el proyecto en SonarQube si no existe
      const projectCreated = await createSonarQubeProject(projectKey, projectName);
      if (!projectCreated) {
        return res.status(500).json({ error: 'No se pudo crear el proyecto en SonarQube' });
      }
      console.log(`Proyecto ${projectKey} creado exitosamente`);
    } else {
      console.log(`El proyecto ${projectKey} ya existe en SonarQube`);
    }

    // Ejecuta SonarScanner para analizar el código
    console.log('Ejecutando SonarScanner...');
    const analysisResult = await runSonarScanner(projectDir);
    
    if (!analysisResult.success) {
      return res.status(500).json({ 
        error: 'Error al ejecutar el análisis con SonarScanner',
        details: analysisResult.output
      });
    }
    
    console.log('Análisis completado, esperando a que SonarQube procese los resultados...');
    
    // Espera a que SonarQube termine de procesar el análisis
    await waitForAnalysisCompletion(projectKey);
    
    // Obtiene los resultados del análisis desde SonarQube
    const analysisResults = await getSonarQubeAnalysisResults(projectKey);
    if (!analysisResults) {
      return res.status(500).json({ error: 'No se pudieron obtener los resultados del análisis' });
    }

    res.json(analysisResults);
  } catch (error) {
    console.error('Error en el proceso de análisis:', error);
    res.status(500).json({ 
      error: 'Error interno al analizar el código',
      details: error.message
    });
  }
});

// Función para determinar la extensión de archivo según el lenguaje
function getFileExtension(language) {
  const extensionMap = {
    'js': 'js',
    'javascript': 'js',
    'ts': 'ts',
    'typescript': 'ts',
    'java': 'java',
    'python': 'py',
    'py': 'py',
    'php': 'php',
    'cs': 'cs',
    'csharp': 'cs',
    // Añade más lenguajes según lo necesites
  };
  
  return extensionMap[language.toLowerCase()] || 'txt';
}

// Función para verificar si un proyecto existe en SonarQube
async function checkIfProjectExists(projectKey) {
  try {
    // Opción A: endpoint oficial (requiere permiso admin/browse)
    const response = await axios.get(
      `${SONARQUBE_URL}/api/project_analyses/search`,
      {
        params: { projects: projectKey },
        headers: { 'Authorization': `Bearer ${SONARQUBE_TOKEN}` }
      }
    );
    // Comprueba si la respuesta contiene tu proyecto
    console.log('Respuesta de búsqueda de proyectos:', response.data);
    if (response.data.components?.some(c => c.key === projectKey)) {
      return true;
    }

    // Opción B: alternativa con menos permisos
    const alt = await axios.get(
      `${SONARQUBE_URL}/api/components/search`,
      {
        params: { qualifiers: 'TRK', q: projectKey },
        headers: { 'Authorization': `Bearer ${SONARQUBE_TOKEN}` }
      }
    );
    return Array.isArray(alt.data.components) && alt.data.components.length > 0;

  } catch (error) {
    console.error('Error al verificar si el proyecto existe:', error.message);
    return false;
  }
}


// Función para crear un proyecto en SonarQube
async function createSonarQubeProject(projectKey, projectName) {
  try {
    const params = new URLSearchParams();
    params.append('project', projectKey);
    params.append('name', projectName);
    
    await axios.post(
      `${SONARQUBE_URL}/api/projects/create`,
      params,
      { 
        auth: { username: SONARQUBE_TOKEN, password: '' },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return true;
  } catch (error) {
    console.error('Error al crear el proyecto en SonarQube:', error.message);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
    return false;
  }
}

// Función para ejecutar SonarScanner usando un contenedor Docker
async function runSonarScanner(projectDir) {
  try {
    console.log(`Ejecutando SonarScanner en: ${projectDir} (vía Docker)`);

    // Ruta con comillas para espacios
    const volumeMapping = `"${projectDir}:/usr/src"`;

    const cmd = [
      'docker', 'run', '--rm',
      '--network', 'platform-scan-code_appnet',    // ó 'appnet', según tu compose
      '-v', volumeMapping,
      '-e', `SONAR_HOST_URL=http://sonarqube:9000`, // ¡usar el servicio, no localhost!
      '-e', `SONAR_LOGIN=${SONARQUBE_TOKEN}`,
      'sonarsource/sonar-scanner-cli',
      '-Dsonar.projectBaseDir=/usr/src'
    ];

    const fullCmd = cmd.join(' ');
    const { stdout, stderr } = await execPromise(fullCmd);

    console.log('SonarScanner stdout:', stdout);
    if (stderr) console.error('SonarScanner stderr:', stderr);

    return { success: true, output: stdout };
  } catch (error) {
    console.error('Error al ejecutar SonarScanner vía Docker:', error.message);
    return {
      success: false,
      output: error.message + (error.stderr ? '\n' + error.stderr : '')
    };
  }
}




// Función para esperar a que SonarQube termine de procesar el análisis
async function waitForAnalysisCompletion(projectKey) {
  const maxAttempts = 10;
  const delay = 2000; // 2 segundos entre intentos
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${SONARQUBE_URL}/api/ce/component`, {
        params: { component: projectKey },
        auth: { username: SONARQUBE_TOKEN, password: '' }
      });
      
      const queue = response.data.queue || [];
      
      // Si no hay tareas en cola para este componente, el análisis ha terminado
      if (queue.length === 0) {
        console.log('Análisis completado y procesado por SonarQube');
        return true;
      }
      
      console.log(`Análisis en proceso, esperando... (intento ${attempt + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error('Error al verificar el estado del análisis:', error.message);
      // Continúa intentando aunque haya un error
    }
  }
  
  console.log('Tiempo de espera agotado, continuando de todos modos');
  return false;
}

// Función para obtener los resultados del análisis desde SonarQube
async function getSonarQubeAnalysisResults(projectKey) {
  try {
    // Configuración común con Bearer
    const configIssues = {
      headers: { 'Authorization': `Bearer ${SONARQUBE_TOKEN}` },
      params: { componentKeys: projectKey, ps: 100 }
    };
    const issuesResponse = await axios.get(
      `${SONARQUBE_URL}/api/issues/search`,
      configIssues
    );

    const configMetrics = {
      headers: { 'Authorization': `Bearer ${SONARQUBE_TOKEN}` },
      params: {
        component: projectKey,
        metricKeys: 'bugs,vulnerabilities,security_hotspots,code_smells,coverage,duplicated_lines_density'
      }
    };
    const metricsResponse = await axios.get(
      `${SONARQUBE_URL}/api/measures/component`,
      configMetrics
    );

    return {
      projectKey,
      issuesCount: issuesResponse.data.total,
      issues: issuesResponse.data.issues,
      metrics: metricsResponse.data.component?.measures || [],
      dashboardUrl: `${SONARQUBE_URL}/dashboard?id=${projectKey}`
    };
  } catch (error) {
    console.error('Error al obtener los resultados del análisis:', error.message);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
    return null;
  }
}


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`SonarQube configurado en: ${SONARQUBE_URL}`);
  if (!SONARQUBE_TOKEN) {
    console.warn('ADVERTENCIA: SONARQUBE_TOKEN no está configurado');
  }
});