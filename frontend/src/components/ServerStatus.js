function ServerStatus({ status }) {
  return (
    status && (
      <div className={`server-status ${status.status}`}>
        <span className="status-indicator"></span>
        {status.status === 'available' ? 'SonarQube conectado' : 'SonarQube no disponible'}
      </div>
    )
  );
}

export default ServerStatus;
