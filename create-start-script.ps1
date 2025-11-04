$ErrorActionPreference = 'Stop'

param(
  [string]$RepoRoot = (Split-Path -Parent $MyInvocation.MyCommand.Definition)
)

Set-Location -Path $RepoRoot

if (-not (Test-Path -Path (Join-Path $RepoRoot 'backend/package.json'))) {
  throw "Run this from the project root so backend/package.json exists."
}

$scriptContent = @'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Starting backend server..."
npm start --prefix backend
'@

$scriptPath = Join-Path $RepoRoot 'start.sh'
Set-Content -Path $scriptPath -Value $scriptContent -Encoding UTF8

try {
  & git update-index --add --chmod=+x start.sh | Out-Null
} catch {
  Write-Warning "Unable to set the executable bit in git. Run 'git update-index --chmod=+x start.sh' manually if needed."
}

Write-Host "start.sh created at $scriptPath."
