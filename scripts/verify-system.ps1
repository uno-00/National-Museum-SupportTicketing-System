$ErrorActionPreference = "Stop"
$base = "http://localhost:4000"
$failures = @()

function Assert {
  param([string]$Name, [scriptblock]$Test)
  try {
    & $Test
    Write-Host "[OK] $Name" -ForegroundColor Green
  }
  catch {
    Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    $script:failures += $Name
  }
}

function Login {
  param([string]$Email, [string]$Password)
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json
  $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -Body $body -ContentType "application/json"
  if (-not $r.token) { throw "No token returned" }
  return $r.token
}

Write-Host ""
Write-Host "NMP Ticketing system verification"
Write-Host ""

Assert "API health" {
  $h = Invoke-RestMethod "$base/api/health" -TimeoutSec 5
  if (-not $h.ok) { throw "Health check failed" }
}

Assert "Frontend proxy health" {
  $h = Invoke-RestMethod "http://localhost:8080/api/health" -TimeoutSec 5
  if (-not $h.ok) { throw "Frontend health failed" }
}

$adminToken = $null
$recordsToken = $null
$clientToken = $null

Assert "Admin login" { $script:adminToken = Login "admin@nmp.gov.ph" "admin123" }
Assert "Records login" { $script:recordsToken = Login "records@nmp.gov.ph" "records123" }
Assert "Client login" { $script:clientToken = Login "user@nmp.gov.ph" "user123" }

Assert "Published forms (client)" {
  $h = @{ Authorization = "Bearer $clientToken" }
  $null = Invoke-RestMethod "$base/api/forms/published" -Headers $h
}

Assert "Admin tickets list" {
  $h = @{ Authorization = "Bearer $adminToken" }
  $null = Invoke-RestMethod "$base/api/tickets" -Headers $h
}

Assert "Records pending forms" {
  $h = @{ Authorization = "Bearer $recordsToken" }
  $data = Invoke-RestMethod "$base/api/records/forms?status=pending_review" -Headers $h
  if ($null -eq $data.items) { throw "Missing items in response" }
}

Assert "Admin forms list" {
  $h = @{ Authorization = "Bearer $adminToken" }
  $data = Invoke-RestMethod "$base/api/forms/mine" -Headers $h
  if ($null -eq $data.items) { throw "Missing items in response" }
}

Assert "Invalid login rejected" {
  try {
    Login "admin@nmp.gov.ph" "wrong-password"
    throw "Expected login failure"
  }
  catch {
    if ($_.Exception.Message -eq "Expected login failure") { throw $_ }
  }
}

Assert "Records form PDF" {
  $h = @{ Authorization = "Bearer $recordsToken" }
  $items = (Invoke-RestMethod "$base/api/records/forms?status=pending_review" -Headers $h).items
  if (-not $items -or $items.Count -eq 0) { throw "No pending form to test PDF" }
  $formId = $items[0]._id
  $client = New-Object System.Net.WebClient
  $client.Headers.Add("Authorization", "Bearer $recordsToken")
  $bytes = $client.DownloadData("$base/api/records/forms/$formId/document.pdf")
  if ($bytes.Length -lt 100) { throw "PDF response too small" }
}

Write-Host ""
if ($failures.Count -eq 0) {
  Write-Host "All checks passed." -ForegroundColor Green
  exit 0
}

Write-Host "$($failures.Count) check(s) failed." -ForegroundColor Red
exit 1
