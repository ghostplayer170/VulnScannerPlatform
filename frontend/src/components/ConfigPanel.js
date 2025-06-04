const languageOptions = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'py', label: 'Python' },
  { value: 'php', label: 'PHP' },
  { value: 'cs', label: 'C#' }
];

function ConfigPanel({ projectKey, setProjectKey, projectName, setProjectName, language, setLanguage, existingProjects, handleSelectProject }) {
  return (
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
        <p className="hint">Identificador único del proyecto</p>
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
  );
}

export default ConfigPanel;