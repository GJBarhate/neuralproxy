$ErrorActionPreference = "Stop"

$backendDir = Join-Path $PSScriptRoot "backend"
$envFile = Join-Path $backendDir ".env"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line.Split("=", 2)
    if ($parts.Length -eq 2) {
      [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1], cess")
    }
  }
}

Push-Location $backendDir
try {
  mvn spring-boot:run
} finally {
  Pop-Location
}
