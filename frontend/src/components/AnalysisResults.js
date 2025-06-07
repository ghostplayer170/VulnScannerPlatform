import '../styles/AnalysisResults.css';

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
    VULNERABILITY: '🔒',
    CODE_SMELL: '💩',
    SECURITY_HOTSPOT: '🔥'
  };
  return emojis[type] || '❓';
};

const getSeverityPriority = (severity) => {
  const priorities = {
    BLOCKER: 5,
    CRITICAL: 4,
    MAJOR: 3,
    MINOR: 2,
    INFO: 1
  };
  return priorities[severity] || 0;
};

export default function AnalysisResults({ issues }) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return (
      <div className="analysis-container">
        <div className="warning-card">
          <h2 className="warning-title">Análisis Completado</h2>
          <p className="warning-message">No se han detectado problemas en el código analizado.</p>
          <p className="warning-suggestion">Puedes intentar con otro código o revisar la configuración del proyecto.</p>
          <p className="warning-note">Si crees que esto es un error, revisa la configuración del proyecto o contacta al administrador.</p>
          <p className="warning-note">Recuerda que el análisis depende de la calidad del código y las reglas configuradas.</p>
          <p className="warning-note">¡Gracias por usar nuestro analizador de código!</p>
        </div>
      </div>
    );
  }

  const totalIssues = issues.length;
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});
  const typeCounts = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  const sortedIssues = [...issues].sort(
    (a, b) => getSeverityPriority(b.severity) - getSeverityPriority(a.severity)
  );

  return (
    <div className="analysis-container">
      <div className="analysis-card">
        <h2 className="analysis-title">Resultados del Análisis</h2>

        <div className="metrics-grid">
          <div className="metric-card total-issues">
            <div className="metric-value">{totalIssues}</div>
            <div className="metric-label">Total Issues</div>
          </div>
          {Object.entries(severityCounts).map(([sev, count]) => (
            <div
              key={sev}
              className="metric-card severity-card"
              style={{
                backgroundColor: `${getSeverityColor(sev)}15`,
                borderColor: `${getSeverityColor(sev)}50`
              }}
            >
              <div className="metric-value" style={{ color: getSeverityColor(sev) }}>
                {count}
              </div>
              <div className="metric-label">{sev.toLowerCase()}</div>
            </div>
          ))}
        </div>

        <div className="types-section">
          <h3 className="section-title">Resumen por Tipo</h3>
          <div className="types-grid">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="type-card">
                <div className="type-emoji">{getIssueTypeEmoji(type)}</div>
                <div className="type-count">{count}</div>
                <div className="type-name">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="issues-section">
          <h3 className="section-title">Problemas Encontrados ({sortedIssues.length})</h3>
          <div className="table-container">
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Descripción</th>
                  <th>Etiquetas</th>
                  <th>Ubicación</th>
                  <th>Esfuerzo</th>
                  <th>Solución</th> {/* nueva columna */}
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((issue) => (
                  <tr key={issue.key}>
                    <td>
                      <div className="issue-type">
                        <span className="issue-emoji">{getIssueTypeEmoji(issue.type)}</span>
                        <span className="issue-type-text">
                          {issue.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td>
                      <div className="issue-description">
                        <p className="issue-message">{issue.message}</p>
                        {issue.rule && <p className="issue-rule">Regla: {issue.rule}</p>}
                      </div>
                    </td>
                    <td>
                      <div className="issue-tags">
                        {issue.tags && issue.tags.map((tag, index) => (
                          <span key={index} className="issue-tag">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="issue-location">
                        <div className="location-file">
                          {issue.component.split(':').pop()}
                        </div>
                        {issue.line && <div className="location-line">Línea: {issue.line}</div>}
                        {issue.textRange && (
                          <div className="location-range">
                            Rango: {issue.textRange.startLine} - {issue.textRange.endLine}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="issue-effort">{issue.effort || issue.debt}</span>
                    </td>
                    <td>
                      <details className="issue-solution">
                        <summary>Ver guía</summary>
                        <div
                          className="solution-content"
                          dangerouslySetInnerHTML={{ __html: issue.solutionHtml }}
                        />
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
