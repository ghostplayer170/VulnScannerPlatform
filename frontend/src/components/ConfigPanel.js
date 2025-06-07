import { useEffect, useState } from 'react';
import { getSupportedLanguages } from '../services/api';

function ConfigPanel({
  projectKey,
  setProjectKey,
  projectName,
  setProjectName,
  language,
  setLanguage,
  existingProjects,
  handleSelectProject,
  handleDeleteProject
}) {
  const [languageOptions, setLanguageOptions] = useState([]);

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const langs = await getSupportedLanguages();
        if (!Array.isArray(langs) || langs.length === 0) {
          throw new Error('No se encontraron lenguajes disponibles');
        }
        const options = langs.map(lang => ({
          value: lang.key,
          label: lang.name
        }));
        setLanguageOptions(options);
      } catch (err) {
        console.error('Error al obtener lenguajes:', err);
        setLanguageOptions([{ value: 'unknown', label: 'Desconocido' }]);
      }
    }
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (projectName.trim()) {
      const sanitized = projectName.trim().replace(/\s+/g, '_');
      const key = `project_${sanitized}_${new Date().toISOString().split('T')[0]}`;
      setProjectKey(key);
    }
  }, [projectName]);

  return (
    <div className="config-panel">
      <h2>Configuración</h2>

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
        <label htmlFor="projectKey">Project Key:</label>
        <input
          id="projectKey"
          type="text"
          value={projectKey}
          disabled
        />
        <p className="hint">Se genera automáticamente a partir del nombre del proyecto</p>
      </div>

      <div className="form-group">
        <label htmlFor="language">Lenguaje:</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
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
                  onClick={() => {handleSelectProject(project)}}
                  className={projectKey === project.key ? 'selected' : ''}
                >
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {existingProjects.length > 0 && projectKey && (
        <div className="form-group">
          <button
            className="delete-project-btn"
            onClick={() => { handleDeleteProject(projectKey); console.log(`Proyecto ${projectKey} eliminado`); }}
          >
            🗑️ Eliminar Proyecto Seleccionado
          </button>
        </div>
      )}

    </div>
  );
}

export default ConfigPanel;
