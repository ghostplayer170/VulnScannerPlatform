// Componente para mostrar el estado del servidor SonarQube
function ServerStatus({ status }) {
  return (
    status && (
      <div className={`server-status ${status.status}`}>
        <span className="status-indicator"></span>
        <span className="status-text">
          SonarQube está {status.status === 'available' ? 'disponible' : 'no disponible'}
        </span>
      </div>
    )
  );
}

export default ServerStatus;
