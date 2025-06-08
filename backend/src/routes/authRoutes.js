const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

// Rutas de autenticación 
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ email, passwordHash });
    console.log('Registrando usuario:', user);
    await user.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'No se pudo registrar usuario' });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    res.status(200).json({ message: 'Login exitoso', token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// authRoutes.js
router.get('/validate', verifyToken, (req, res) => {
  res.status(200).json({ valid: true });
});


module.exports = router;
