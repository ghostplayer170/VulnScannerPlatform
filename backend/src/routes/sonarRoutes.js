const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { getProjectMetrics } = require('../services/sonarService');
const verifyToken = require('../middleware/authMiddleware');
const Project = require('../models/Project');

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

router.get('/metrics', async (req, res) => {
  const projectKey = req.query.projectKey;
  if (!projectKey) return res.status(400).json({ error: 'Falta projectKey' });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const project = await Project.findOne({ userId: user._id, projectKey });
    if (!project) return res.status(403).json({ error: 'Acceso denegado al proyecto' });

    const metrics = await getProjectMetrics(projectKey);
    res.json(metrics);
  } catch (err) {
    console.error('Error obteniendo métricas:', err);
    res.status(500).json({ error: err.message });
  }
});

const { runSonarScanner } = require('../services/sonarService');

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



module.exports = router;