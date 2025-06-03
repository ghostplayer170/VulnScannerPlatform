# Script de configuración para Windows (PowerShell)

Write-Host "Iniciando los contenedores..." -ForegroundColor Yellow
try {
    # Docker Desktop debe estar en ejecución
    docker compose up -d sonarqube 
    Write-Host "Contenedores iniciados." -ForegroundColor Green
} catch {
    Write-Host "Error al iniciar los contenedores. Asegúrate de que Docker Desktop esté en ejecución." -ForegroundColor Red
    exit 1
}

Write-Host "Esperando a que SonarQube este disponible..." -ForegroundColor Yellow
$sonarReady = $false
while (-not $sonarReady) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -ErrorAction SilentlyContinue
        if ($response.status -eq "UP") {
            $sonarReady = $true
        } else {
            Write-Host "SonarQube aun no esta disponible, esperando 10 segundos..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    } catch {
        Write-Host "SonarQube aun no está disponible, esperando 10 segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

Write-Host "SonarQube está disponible." -ForegroundColor Green

# Obtener el token de admin para autenticación inicial
Write-Host "Generando token de SonarQube..." -ForegroundColor Yellow
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin"))
$headers = @{Authorization = "Basic $base64AuthInfo"}

try {
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/user_tokens/generate" `
                                      -Method Post `
                                      -Headers $headers `
                                      -Body "name=code-analyzer-token" `
                                      -ContentType "application/x-www-form-urlencoded" `
                                      -ErrorAction Stop
    $token = $tokenResponse.token
    
    Write-Host "Token generado: $token" -ForegroundColor Green
    
    # Guardar el token en el archivo .env para el backend
    "SONARQUBE_TOKEN=$token" | Out-File -FilePath ".env" -Encoding ascii
    
    # Actualizar variable de entorno SONARQUBE_TOKEN en el contenedor backend
    Write-Host "Actualizando variable de entorno en el contenedor backend..." -ForegroundColor Yellow
    docker-compose stop backend
    docker-compose up -d backend
    
    Write-Host "¡Configuración completada!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
    Write-Host "SonarQube: http://localhost:9000 (usuario: admin, contraseña: admin)" -ForegroundColor Yellow
    Write-Host "SonarQube Token: $token" -ForegroundColor Yellow
    Write-Host "Es recomendable cambiar la contraseña de admin en SonarQube por seguridad." -ForegroundColor Yellow
} catch {
    Write-Host "No se pudo generar el token. Probablemente ya existe uno." -ForegroundColor Yellow
    Write-Host "Intenta eliminar el token anterior antes de crear uno nuevo:" -ForegroundColor Yellow
    Write-Host "Invoke-RestMethod -Uri 'http://localhost:9000/api/user_tokens/revoke' -Method Post -Headers `$headers -Body 'name=code-analyzer-token' -ContentType 'application/x-www-form-urlencoded'"
    Write-Host "Luego ejecuta este script nuevamente." -ForegroundColor Yellow
}