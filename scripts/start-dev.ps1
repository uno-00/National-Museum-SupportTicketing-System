$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Test-Api {
  try {
    $r = Invoke-RestMethod "http://localhost:4000/api/health" -TimeoutSec 2
    return [bool]$r.ok
  } catch {
    return $false
  }
}

function Test-Frontend {
  param([int]$Port = 8080)
  try {
    $r = Invoke-RestMethod "http://localhost:$Port/api/health" -TimeoutSec 2
    return [bool]$r.ok
  } catch {
    return $false
  }
}

Write-Host ""
Write-Host "NMP Ticketing - starting dev environment"
Write-Host ""

if (-not (Test-Path "$root\backend\.env")) {
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
  Write-Host "Created backend/.env"
}
if (-not (Test-Path "$root\frontend\.env")) {
  Copy-Item "$root\frontend\.env.example" "$root\frontend\.env"
  Write-Host "Created frontend/.env"
}

if (-not (Test-Api)) {
  Write-Host "Seeding database (needs MongoDB)..."
  Push-Location "$root\backend"
  npm run seed
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Seed failed. Start MongoDB first, then run: npm run start"
    Pop-Location
    exit 1
  }
  Pop-Location

  Write-Host "Starting backend (new window)..."
  $backendCmd = "Set-Location '$root\backend'; Write-Host 'BACKEND - keep open'; npm run dev"
  Start-Process powershell -ArgumentList @("-NoExit", "-Command", $backendCmd)

  Write-Host "Waiting for API on port 4000..."
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Api) {
      $ready = $true
      break
    }
  }
  if (-not $ready) {
    Write-Host "ERROR: API did not start. Check MongoDB and the backend window."
    exit 1
  }
  Write-Host "API ready: http://localhost:4000/api/health"
} else {
  Write-Host "API already running: http://localhost:4000"
}

if (-not (Test-Frontend)) {
  Write-Host "Starting frontend (new window)..."
  $frontendCmd = "Set-Location '$root\frontend'; Write-Host 'FRONTEND - keep open'; npm run dev"
  Start-Process powershell -ArgumentList @("-NoExit", "-Command", $frontendCmd)

  Write-Host "Waiting for frontend..."
  $feReady = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    if ((Test-Frontend -Port 8080) -or (Test-Frontend -Port 8081)) {
      $feReady = $true
      break
    }
  }
  if (-not $feReady) {
    Write-Host "WARNING: Frontend slow to start. Check the frontend window for the URL."
  }
} else {
  Write-Host "Frontend already running on port 8080"
}

Write-Host ""
Write-Host "Open in browser:"
Write-Host "  http://localhost:8080/login"
Write-Host "  Admin:   admin@nmp.gov.ph / admin123"
Write-Host "  Records: records@nmp.gov.ph / records123"
Write-Host "  Client:  user@nmp.gov.ph / user123"
Write-Host ""
Write-Host "Workflow: Admin submits form -> Records reviews (separate tab) -> Client submits request"
Write-Host "All three portals can stay logged in at the same time."
Write-Host ""
