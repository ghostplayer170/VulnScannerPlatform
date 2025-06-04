require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const sonarRoutes = require('./routes/sonarRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors()); 

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/sonarqube', sonarRoutes);

// Conectar a MongoDB y levantar el servidor
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Servidor iniciado en puerto ${process.env.PORT || 5000}`);
  });
}).catch(err => {
  console.error('Error de conexión a MongoDB:', err);
});
