const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { createSonarProject } = require('../services/sonarService');
const verifyToken = require('../middleware/authMiddleware');
const Analysis = require('../models/Analysis');

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

  const projectKey = `project_${name.replace(/\s+/g, '_')}_${Date.now()}`;

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

/**
 * DELETE /project
 * Elimina un proyecto por su projectKey
 */
router.delete('/:projectKey', async (req, res) => {
  const { projectKey } = req.params;
  try {
    // Elimina el proyecto de MongoDB
    const deletedProject = await Project.findOneAndDelete({ projectKey, userId: req.userId });
    if (!deletedProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    // Aquí podrías agregar lógica para eliminar el proyecto de SonarQube si es necesario
    res.status(200).json({ message: 'Proyecto eliminado correctamente de la Base de Datos' });
  } catch (err) {
    console.error('Error al eliminar proyecto:', err);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

/**
 * POST /results/:projectKey 
 * Guarda en la base de datos el analisis de un proyecto
 */
router.post('/results/:projectKey', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { issues } = req.body;
    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({ message: 'Debes enviar un array de issues' });
    }

    const project = await Project.findOne({ projectKey });
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const analysis = new Analysis({
      projectId: project._id,
      issues,
      issuesCount: issues.length,
    });

    await analysis.save();

    return res.status(201).json(analysis);
  } catch (err) {
    console.error('Error guardando análisis:', err);
    return res.status(500).json({
      message: 'Error al guardar el análisis',
      error: err.message
    });
  }
});

/**
 * GET /results/:projectKey
 * Obtiene los resultados del análisis de un proyecto por su projectKey
 */
router.get('/results/:projectKey', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const project = await Project.findOne({ projectKey });
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    const analysis = await Analysis.findOne({ projectId: project._id }).sort({ createdAt: -1 });
    if (!analysis) {
      return res.status(404).json({ message: 'No se encontraron resultados de análisis para este proyecto' });
    }
    return res.status(200).json(analysis);
  } catch (err) {
    console.error('Error obteniendo resultados de análisis:', err);
    return res.status(500).json({
      message: 'Error al obtener los resultados del análisis',
      error: err.message
    });
  }
});

module.exports = router;
