const express = require('express');
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware');
const { runSonarScanner } = require('../services/sonarService');
const router = express.Router();

router.use(verifyToken);

router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.SONARQUBE_URL}/api/system/status`);
    res.json(response.data);
  } catch (err) {
    console.error('Error obteniendo estado de SonarQube:', err);
    res.status(500).json({ error: 'No se pudo obtener el estado de SonarQube' });
  }
});

router.post('/analyze', async (req, res) => {
  const { projectKey, code, language } = req.body;
  try {
    const output = await runSonarScanner(projectKey, code, language);
    res.status(200).json({ message: 'Análisis completado', output });
  } catch (err) {
    console.error('Error al ejecutar análisis:', err.message);
    res.status(500).json({ error: 'Error al ejecutar análisis', details: err.message });
  }
});

router.get('/languages', async (req, res) => {
  try {
    const response = await getSupportedLanguages();
    if (!response || !response.data) {
      return res.status(500).json({ error: 'No se pudieron obtener los lenguajes' });
    }
    const languages = response.data.languages || [];
    res.json({ languages });
  } catch (err) {
    console.error('Error obteniendo lenguajes:', err);
    res.status(500).json({ error: 'No se pudieron obtener los lenguajes' });
  }
});

module.exports = router;