$ErrorActionPreference = "Stop"

$frontendDir = Join-Path $PSScriptRoot "frontend"

Push-Location $frontendDir
try {
  if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    npm install
  }

  npm run dev
} finally {
  Pop-Location
}
