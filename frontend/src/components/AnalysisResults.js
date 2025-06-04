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

const getIssueTypeEmoji = (type) => {
  const emojis = {
    BUG: '🐞',
    VULNERABILITY: '🛡️',
    CODE_SMELL: '💩',
    SECURITY_HOTSPOT: '🔥'
  };
  return emojis[type] || '❓';
};

function AnalysisResults({ result }) {
  if (result.error) {
    return (
      <div className="results-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{result.error}</p>
          {result.details && <pre className="error-details">{result.details}</pre>}
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <h2>Resultados del Análisis</h2>
      <div className="metrics-panel">
        <div className="metric-card">
          <span className="metric-value">{result.issuesCount || 0}</span>
          <span className="metric-label">Total Issues</span>
        </div>
        {result.metrics && result.metrics.map(metric => (
          <div className="metric-card" key={metric.metric}>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">
              {metric.metric.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
        ))}
      </div>

      {result.issues?.length > 0 ? (
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
              {result.issues.map((issue, index) => (
                <tr key={index}>
                  <td>
                    <span className="issue-type">{getIssueTypeEmoji(issue.type)} {issue.type}</span>
                  </td>
                  <td>
                    <span className="severity-badge" style={{ backgroundColor: getSeverityColor(issue.severity) }}>{issue.severity}</span>
                  </td>
                  <td>{issue.message}</td>
                  <td className="location">{issue.component.split(':').pop()}{issue.line && `:${issue.line}`}</td>
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

      {result.dashboardUrl && (
        <div className="sonar-link">
          <p><a href={result.dashboardUrl} target="_blank" rel="noreferrer">Ver resultados completos en SonarQube</a></p>
        </div>
      )}
    </div>
  );
}

export default AnalysisResults;