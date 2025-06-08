const express = require('express');
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware');
const { runSonarScanner, getSupportedLanguages, getServerStatus } = require('../services/sonarService');
const router = express.Router();

router.use(verifyToken);

// Ruta para verificar el estado de SonarQube
router.get('/status', async (req, res) => {
  try {
    const serverStatus = await getServerStatus();
    if (!serverStatus || !serverStatus.status) {
      return res.status(500).json({ error: 'No se pudo obtener el estado de SonarQube' });
    }
    res.json(serverStatus);
  } catch (err) {
    console.error('Error obteniendo estado de SonarQube:', err);
    res.status(500).json({ error: 'No se pudo obtener el estado de SonarQube' });
  }
});

// Ruta para analizar código y guardar resultados
router.post('/analyze', async (req, res) => {
  const { projectKey, code, language } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const output = await runSonarScanner(projectKey, code, language);  
    console.log('Análisis completado:', output);  
    const response = await axios.post(
      `${process.env.BACKEND_URL}/projects/results/${projectKey}`,
      { issues: output },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}
      }
    );
    console.log('Resultados guardados:', response.data);
    res.status(200).json({ message: 'Análisis completado', output });
  } catch (err) {
    console.error('Error al ejecutar análisis:', err.message);
    res.status(500).json({ error: 'Error al ejecutar análisis', details: err.message });
  }
});

// Ruta para obtener lenguajes soportados por SonarQube
router.get('/languages', async (req, res) => {
  try {
    const response = await getSupportedLanguages();
    const languages = response.languages || [];
    res.status(200).json({ languages });
  } catch (err) {
    console.error('Error obteniendo lenguajes:', err);
    res.status(500).json({ error: 'No se pudieron obtener los lenguajes' });
  }
});

module.exports = router;