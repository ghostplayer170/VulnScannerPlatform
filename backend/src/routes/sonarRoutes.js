const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { getProjectMetrics } = require('../services/sonarService');
const verifyToken = require('../middleware/authMiddleware');
const Project = require('../models/Project');

const router = express.Router();
router.use(verifyToken);


// Rutas públicas
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.SONARQUBE_URL}/api/system/status`);
    res.json(response.data);
  } catch (err) {
    console.error('Error obteniendo estado de SonarQube:', err);
    res.status(500).json({ error: 'No se pudo obtener el estado de SonarQube' });
  }
});

// Rutas protegidas
router.post('/projects', async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  const projectKey = `project_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    await createSonarProject(projectKey, name);
    const newProject = new Project({ userId, projectKey, name });
    await newProject.save();

    res.status(201).json({ message: 'Proyecto creado correctamente', project: newProject });
  } catch (err) {
    console.error('Error creando proyecto:', err);
    res.status(500).json({ error: 'No se pudo crear el proyecto' });
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

module.exports = router;