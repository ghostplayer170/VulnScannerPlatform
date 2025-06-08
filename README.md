# VulnScannerPlatform

Plataforma web que integra **SonarQube**, un backend en **Node.js/Express** y un frontend en **React** para analizar codigo fuente y gestionar proyectos.

## Funcionalidades principales

- **Autenticación con JWT**  
  Registro e inicio de sesión seguros. Las rutas del backend requieren un token válido.
- **Gestión de proyectos**  
  Cada usuario puede crear proyectos que quedan almacenados en MongoDB.
- **Análisis de código**  
  El backend ejecuta SonarQube Scanner con el código enviado y obtiene los resultados.  
  Se almacenan detalles de las vulnerabilidades y se consulta la posible solución para cada problema detectado.
- **Listado de análisis**  
  En el frontend se muestran los resultados por proyecto, incluyendo número de issues y severidad.
- **Interfaz React**  
  Aplicación SPA para manejar autenticación, creación de proyectos, envío de código y visualización de resultados.
- **Contenedores Docker**  
  Todo el stack (SonarQube, MongoDB, backend y frontend) puede desplegarse con `docker compose`.

## Requisitos

- [Docker](https://www.docker.com/) instalados.

## Configuración

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/ghostplayer170/VulnScannerPlatform.git
   cd VulnScannerPlatform
   ```

2. **Variables de entorno del backend**

   Crear un archivo `backend/.env` con las siguientes claves (ajustar valores segun tu entorno):

   ```env
   PORT=5000
   MONGO_URI=mongodb://root:example@mongo:27017/vulnscanner?authSource=admin
   JWT_SECRET=tu_secreto
   JWT_EXPIRATION=1h
   SONARQUBE_URL=http://sonarqube:9000
   SONARQUBE_TOKEN=<token>
   SONARQUBE_USER=<usuario>
   SONARQUBE_PASS=<password>
   BACKEND_URL=http://localhost:5000
   ```
   ***Nota***:
   Para las claves [SONARQUBE_TOKEN, SONARQUBE_USER, SONARQUBE_PASS], se debe seguir la guia de [Sonarqube: Managing your tokens](https://docs.sonarsource.com/sonarqube-server/latest/user-guide/managing-tokens/).
   Se debe acceder al sevidor mediante [SONARQUBE_URL](http://sonarqube:9000), crear una cuenta de servicio y asignarlo al grupo de administradores y generar un token global.

   Estas variables son leidas por el servidor Express

4. **Variables de entorno del frontend**

   En `frontend/.env` definir la URL del backend:

   ```env
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

   Este valor es utilizado para todas las peticiones desde React

## Ejecucion con Docker Compose

Con los `.env` configurados, levantar los servicios:

```bash
docker compose up --build
```

Se iniciaran:

- SonarQube (puerto 9000)
- MongoDB (puerto 27017)
- Backend Node.js (puerto 5000)
- Frontend servido por Nginx (puerto 8080)

Los puertos estan especificados en `compose.yml`

Accede a `http://localhost:8080` para abrir la aplicacion.

## Desarrollo sin Docker

Cada componente puede ejecutarse de forma independiente:

```bash
# Backend
cd backend
npm install
npm start         # usa nodemon por defecto

# Frontend
cd frontend
npm install
npm start         # disponible en http://localhost:3000
```

Asegurate de que el frontend apunte al backend correcto modificando `REACT_APP_BACKEND_URL`.

## Estructura del repositorio

```
compose.yml    # orquestacion de contenedores
backend/       # codigo del servidor Express y conexion con SonarQube
frontend/      # aplicacion React
```

---

Con esta guia podras clonar el proyecto, configurar las variables necesarias y levantar la plataforma completa para comenzar a analizar codigo con SonarQube.
