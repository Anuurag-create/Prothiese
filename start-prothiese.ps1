$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "services/clarum/backend"
$Site = Join-Path $Root "frontend/site"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) { $Python = "python" }

if (-not (Test-Path (Join-Path $Backend ".env"))) {
  Copy-Item (Join-Path $Backend ".env.example") (Join-Path $Backend ".env")
  Write-Host "Created backend/.env. Add your Gemini API key, then run this script again." -ForegroundColor Yellow
  exit 1
}
if (-not (Test-Path (Join-Path $Site "clarum/assets"))) {
  Write-Host "Clarum frontend is not built. Run npm ci and npm run build in services/clarum/frontend first." -ForegroundColor Yellow
  exit 1
}

$BackendCommand = "Set-Location '$Backend'; & '$Python' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
$SiteCommand = "Set-Location '$Root'; python -m http.server 8080 --directory '$Site'"
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $BackendCommand)
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $SiteCommand)
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:8080"
