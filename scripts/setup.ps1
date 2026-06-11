$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Copy-EnvExample($dir) {
  $example = Join-Path $dir ".env.example"
  $envFile = Join-Path $dir ".env"
  if (-not (Test-Path $example)) {
    Write-Warning "Missing $example"
    return
  }
  if (Test-Path $envFile) {
    Write-Host "Keep existing: $envFile"
    return
  }
  Copy-Item $example $envFile
  Write-Host "Created: $envFile"
}

Copy-EnvExample (Join-Path $root "backend")
Copy-EnvExample (Join-Path $root "frontend")

Write-Host ""
Write-Host "Next:"
Write-Host "  Terminal 1: cd backend; npm install; npm run seed; npm run dev"
Write-Host "  Terminal 2: cd frontend; npm install; npm run dev"
Write-Host "  App: http://localhost:8080"
