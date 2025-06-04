import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import './App.css';

function App() {
  const [code, setCode] = useState('// Escribe o pega tu código aquí para analizarlo');
  const [projectKey, setProjectKey] = useState('');
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('js');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [existingProjects, setExistingProjects] = useState([]);

  // Verificar el estado del servidor al cargar
  useEffect(() => {
    checkServerStatus();
    fetchExistingProjects();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/sonarqube/status');
      const data = await response.json();
      setServerStatus(data);
    } catch (error) {
      console.error('Error al verificar el estado del servidor:', error);
      setServerStatus({ status: 'unavailable', error: 'No se puede conectar con el backend' });
    }
  };

  const fetchExistingProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/sonarqube/projects');
      const data = await response.json();
      setExistingProjects(data.components || []);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
    }
  };

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
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          projectKey, 
          projectName,
          language 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      
      // Actualizar la lista de proyectos después del análisis
      fetchExistingProjects();
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      setAnalysisResult({ 
        error: 'Error en el análisis', 
        details: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear la severidad con colores
  const getSeverityColor = (severity) => {
    const colors = {
      BLOCKER: '#d42a2a',
      CRITICAL: '#e74c3c',
      MAJOR: '#f39c12',
      MINOR: '#3498db',
      INFO: '#7f8c8d'
    };
    return colors[severity] || '#7f8c8d';
  };

  // Mapear el tipo de problema a un emoji representativo
  const getIssueTypeEmoji = (type) => {
    const emojis = {
      BUG: '🐞',
      VULNERABILITY: '🛡️',
      CODE_SMELL: '💩',
      SECURITY_HOTSPOT: '🔥'
    };
    return emojis[type] || '❓';
  };

  const languageOptions = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'py', label: 'Python' },
    { value: 'php', label: 'PHP' },
    { value: 'cs', label: 'C#' }
  ];

  return (
    <div className="App">
      <header className="app-header">
        <h1>Analizador de Código con SonarQube</h1>
        {serverStatus && (
          <div className={`server-status ${serverStatus.status}`}>
            <span className="status-indicator"></span>
            {serverStatus.status === 'available' 
              ? 'SonarQube conectado' 
              : 'SonarQube no disponible'}
          </div>
        )}
      </header>

      <div className="main-container">
        <div className="config-panel">
          <h2>Configuración</h2>
          
          <div className="form-group">
            <label htmlFor="projectKey">
              Project Key: <span className="required">*</span>
            </label>
            <input
              id="projectKey"
              type="text"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="my-project"
            />
            <p className="hint">Identificador único del proyecto (solo letras, números y guiones)</p>
          </div>

          <div className="form-group">
            <label htmlFor="projectName">
              Project Name: <span className="required">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Mi Proyecto"
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">Lenguaje:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {existingProjects.length > 0 && (
            <div className="existing-projects">
              <h3>Proyectos existentes</h3>
              <ul className="projects-list">
                {existingProjects.map(project => (
                  <li key={project.key}>
                    <button 
                      onClick={() => handleSelectProject(project)}
                      className={projectKey === project.key ? 'selected' : ''}
                    >
                      {project.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="code-panel">
          <h2>Código a analizar</h2>
          <CodeMirror
            value={code}
            height="400px"
            extensions={[javascript()]}
            onChange={(value) => setCode(value)}
            className="code-editor"
          />

          <button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="analyze-button"
          >
            {loading ? 'Analizando...' : 'Analizar Código'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analizando código... Este proceso puede tomar unos segundos.</p>
        </div>
      )}

      {analysisResult && (
        <div className="results-container">
          {analysisResult.error ? (
            <div className="error-message">
              <h2>Error</h2>
              <p>{analysisResult.error}</p>
              {analysisResult.details && (
                <pre className="error-details">{analysisResult.details}</pre>
              )}
            </div>
          ) : (
            <div>
              <h2>Resultados del Análisis</h2>
              
              <div className="metrics-panel">
                <div className="metric-card">
                  <span className="metric-value">{analysisResult.issuesCount || 0}</span>
                  <span className="metric-label">Total Issues</span>
                </div>
                
                {analysisResult.metrics && analysisResult.metrics.map(metric => (
                  <div className="metric-card" key={metric.metric}>
                    <span className="metric-value">{metric.value}</span>
                    <span className="metric-label">
                      {metric.metric.replace(/_/g, ' ').toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </span>
                  </div>
                ))}
              </div>
              
              {analysisResult.issues && analysisResult.issues.length > 0 ? (
                <div className="issues-list">
                  <h3>Problemas encontrados</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Severidad</th>
                        <th>Descripción</th>
                        <th>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.issues.map((issue, index) => (
                        <tr key={index}>
                          <td>
                            <span className="issue-type">
                              {getIssueTypeEmoji(issue.type)} {issue.type}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="severity-badge"
                              style={{ backgroundColor: getSeverityColor(issue.severity) }}
                            >
                              {issue.severity}
                            </span>
                          </td>
                          <td>{issue.message}</td>
                          <td className="location">
                            {issue.component.split(':').pop()}
                            {issue.line && `:${issue.line}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-issues">
                  <p>¡Felicidades! No se encontraron problemas en el código.</p>
                </div>
              )}
              
              {analysisResult.dashboardUrl && (
                <div className="sonar-link">
                  <p>
                    <a href={analysisResult.dashboardUrl} target="_blank" rel="noreferrer">
                      Ver resultados completos en SonarQube
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .App {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .server-status {
          display: flex;
          align-items: center;
          font-size: 14px;
          padding: 5px 10px;
          border-radius: 4px;
          background-color: #f5f5f5;
        }
        
        .server-status.available {
          color: #2ecc71;
        }
        
        .server-status.unavailable {
          color: #e74c3c;
        }
        
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .server-status.available .status-indicator {
          background-color: #2ecc71;
        }
        
        .server-status.unavailable .status-indicator {
          background-color: #e74c3c;
        }
        
        .main-container {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .config-panel {
          flex: 1;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .code-panel {
          flex: 2;
          display: flex;
          flex-direction: column;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .required {
          color: #e74c3c;
          margin-left: 3px;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .hint {
          margin-top: 5px;
          font-size: 12px;
          color: #7f8c8d;
        }
        
        .code-editor {
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .analyze-button {
          padding: 10px 15px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
          align-self: flex-start;
        }
        
        .analyze-button:hover {
          background-color: #2980b9;
        }
        
        .analyze-button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .loading-spinner {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .results-container {
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .error-message {
          color: #e74c3c;
          padding: 15px;
          background-color: #fadbd8;
          border-radius: 4px;
        }
        
        .error-details {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          white-space: pre-wrap;
          margin-top: 10px;
        }
        
        .metrics-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          background-color: #f8f9fa;
          border-radius: 4px;
          padding: 15px;
          min-width: 120px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .metric-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        .issues-list {
          margin-top: 20px;
        }
        
        .issues-list table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .issues-list th, .issues-list td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .issues-list th {
          background-color: #f8f9fa;
          font-weight: 500;
        }
        
        .severity-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
        }
        
        .issue-type {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .location {
          font-family: monospace;
          font-size: 13px;
        }
        
        .no-issues {
          padding: 20px;
          text-align: center;
          background-color: #e8f8f5;
          border-radius: 4px;
          color: #27ae60;
        }
        
        .sonar-link {
          margin-top: 20px;
          text-align: right;
        }
        
        .sonar-link a {
          color: #3498db;
          text-decoration: none;
        }
        
        .sonar-link a:hover {
          text-decoration: underline;
        }
        
        .existing-projects {
          margin-top: 20px;
        }
        
        .projects-list {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .projects-list li {
          margin-bottom: 5px;
        }
        
        .projects-list button {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .projects-list button:hover {
          background-color: #f5f5f5;
        }
        
        .projects-list button.selected {
          border-color: #3498db;
          background-color: #ebf5fb;
        }
      `}</style>
    </div>
  );
}

export default App;