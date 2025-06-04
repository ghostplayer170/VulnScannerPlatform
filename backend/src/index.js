require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const sonarRoutes = require('./routes/sonarRoutes');

const app = express();
app.use(express.json());

app.use('/projects', require('./routes/projectRoutes'));
app.use('/auth', authRoutes);
app.use('/sonarqube', sonarRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Servidor iniciado en puerto ${process.env.PORT}`);
  });
}).catch(err => {
  console.error('Error de conexión a MongoDB:', err);
});
