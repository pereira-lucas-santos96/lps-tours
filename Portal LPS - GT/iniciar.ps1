$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$portableNode = Join-Path $PSScriptRoot '.tools\node.exe'
if (Test-Path -LiteralPath $portableNode) {
    & $portableNode server.mjs
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    node server.mjs
} else {
    Write-Host 'Instale o Node.js 22 ou superior em https://nodejs.org e execute novamente.'
}
