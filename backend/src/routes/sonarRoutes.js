const express = require('express');
const User = require('../models/User');
const { getProjectMetrics } = require('../services/sonarService');
const verifyToken = require('../middleware/authMiddleware'); // Middleware JWT
const router = express.Router();
const Project = require('../models/Project');

router.use(verifyToken); // Verifica JWT y agrega req.userId

router.post('/projects', verifyToken, async (req, res) => {
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
