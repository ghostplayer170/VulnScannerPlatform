// App.js
import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import ConfigPanel from './components/ConfigPanel';
import AnalysisResults from './components/AnalysisResults';
import ServerStatus from './components/ServerStatus';
import { checkServerStatus, fetchExistingProjects, sendAnalysisRequest, validateToken } from './services/api';
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

  const handleLogin = (jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
  };

  useEffect(() => {
    if (token) {
      checkServerStatus().then(setServerStatus);
      fetchExistingProjects().then(setExistingProjects);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let timeoutId;

    const refreshStatus = async () => {
      try {
        const statusData = await checkServerStatus();
        setServerStatus(statusData);

        // Define el intervalo según el estado
        const delay = statusData.status === 'available' ? 5 * 60 * 1000 : 30 * 1000;

        // Programa la próxima verificación
        timeoutId = setTimeout(refreshStatus, delay);
      } catch (err) {
        console.error('Error al actualizar estado del servidor:', err);
        timeoutId = setTimeout(refreshStatus, 30 * 1000); // fallback
      }
    };

    refreshStatus();

    // Limpia el temporizador al desmontar el componente
    return () => clearTimeout(timeoutId);
  }, [token]);

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const handleSelectProject = (project) => {
    setProjectKey(project.key);
    setProjectName(project.name);
  };

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
        <h1>Analizador de Código con SonarQube</h1>
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
