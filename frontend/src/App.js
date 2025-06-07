// App.js
import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import ConfigPanel from './components/ConfigPanel';
import AnalysisResults from './components/AnalysisResults';
import ServerStatus from './components/ServerStatus';
import {
  checkServerStatus, fetchExistingProjects, sendAnalysisRequest, validateToken, deleteProject, getAnalysisResultsForProject
} from './services/api';
import LoginForm from './components/LoginForm';
import './styles/App.css';

function App() {
  const [code, setCode] = useState('// Escribe o pega tu código aquí para analizarlo');
  const [projectKey, setProjectKey] = useState('');
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('js');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [existingProjects, setExistingProjects] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Si no hay token, redirige al usuario a la página de inicio de sesión
  useEffect(() => {
    const checkToken = async () => {
      try {
        await validateToken(); // Llama al backend para validar el token
        checkServerStatus().then(setServerStatus);
        fetchExistingProjects().then(setExistingProjects);
      } catch (err) {
        console.error('Token inválido o expirado:', err);
        localStorage.removeItem('token');
        setToken('');
      }
    };

    if (token) {
      checkToken();
    }
  }, [token]);

  // Maneja el inicio de sesión y guarda el token en localStorage
  const handleLogin = (jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
  };

  // Verifica el estado del servidor y obtiene proyectos existentes al cargar la aplicación
  useEffect(() => {
    if (token) {
      checkServerStatus().then(setServerStatus);
      fetchExistingProjects().then(setExistingProjects);
    }
  }, [token]);

  // Verifica el estado del servidor cada minuto si hay un token válido
  useEffect(() => {
    if (!token) return;

    const fetchStatus = async () => {
      try {
        const statusData = await checkServerStatus();
        setServerStatus(statusData);
      } catch (error) {
        console.error('Error al obtener estado del servidor:', error);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 60 * 1000); // cada 60 segundos
    return () => clearInterval(intervalId);
  }, [token]);
  
  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Maneja la eliminación de un proyecto existente
  const handleDeleteProject = async (projectKeyToDelete) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el proyecto "${projectKeyToDelete}"? Esta acción no se puede deshacer.`)) return;

    try {
      console.log('Eliminando proyecto:', projectKeyToDelete);
      await deleteProject(projectKeyToDelete);
      const updatedProjects = await fetchExistingProjects();
      setExistingProjects(updatedProjects);

      // Si el proyecto eliminado es el que estaba seleccionado
      if (projectKey === projectKeyToDelete) {
        setProjectKey('');
        setProjectName('');
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error al eliminar el proyecto:', err);
      alert('No se pudo eliminar el proyecto. Inténtalo nuevamente.');
    }
  };

  // Maneja la selección de un proyecto existente
  const handleSelectProject = async (project) => {
    setProjectKey(project.key);
    setProjectName(project.name);
    try {
      const results = await getAnalysisResultsForProject(project.projectKey);
      setAnalysisResult(results);
    } catch (error) {
      console.error('Error al obtener resultados del análisis:', error);
      setAnalysisResult({ error: 'No se pudo recuperar el análisis del proyecto.' });
    }
  };

  // Maneja el análisis del código
  const handleAnalyze = async () => {
    if (!projectKey.trim() || !projectName.trim()) {
      alert('Por favor complete el Project Key y Project Name');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const result = await sendAnalysisRequest({ code, projectKey, projectName, language });
      setAnalysisResult(result.output);
      const updatedProjects = await fetchExistingProjects();
      setExistingProjects(updatedProjects);
    } catch (error) {
      setAnalysisResult({ error: 'Error en el análisis', details: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1 className='app-title'>Analizador de Código con SonarQube</h1>
        <ServerStatus status={serverStatus} />
      </header>

      <div className="main-container">
        <ConfigPanel
          projectKey={projectKey}
          setProjectKey={setProjectKey}
          projectName={projectName}
          setProjectName={setProjectName}
          language={language}
          setLanguage={setLanguage}
          existingProjects={existingProjects}
          handleSelectProject={handleSelectProject}
          handleDeleteProject={handleDeleteProject}
        />

        <CodeEditor
          code={code}
          setCode={setCode}
          handleAnalyze={handleAnalyze}
          loading={loading}
        />
      </div>

      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Analizando código...</p></div>}

      {analysisResult && <AnalysisResults issues={analysisResult} />}
    </div>
  );
}

export default App;
