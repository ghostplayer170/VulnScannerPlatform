const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { createSonarProject } = require('../services/sonarService');
const verifyToken = require('../middleware/authMiddleware');

// Middleware para verificar el token de autenticación
router.use(verifyToken);

/**
 * POST /projects
 * Crea un nuevo proyecto en SonarQube y lo guarda en MongoDB
 */
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }

  const projectKey = `project_${userId}_${name.replace(/\s+/g, '_')}_${Date.now()}`;

  try {
    // Crea el proyecto en SonarQube
    const sonarResponse = await createSonarProject(projectKey, name);
    
    if (sonarResponse.status !== 'success') {
      return res.status(500).json({ error: sonarResponse.message });
    }
    const newProject = new Project({ userId, projectKey, name });
    await newProject.save();

    res.status(201).json({ message: 'Proyecto creado correctamente', project: newProject });
  } catch (err) {
    console.error('Error al crear proyecto:', err);
    res.status(500).json({ error: 'No se pudo crear el proyecto' });
  }
});


/**
 * GET /projects
 * Devuelve todos los proyectos del usuario autenticado
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ projects: projects });
  } catch (err) {
    console.error('Error al obtener proyectos:', err);
    res.status(500).json({ error: 'Error al recuperar los proyectos' });
  }
});

module.exports = router;
