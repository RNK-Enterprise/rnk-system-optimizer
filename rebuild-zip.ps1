$src = Split-Path $MyInvocation.MyCommand.Path
$staging = "$env:TEMP\rnk-vso-staging"
$zipOut = "$src\zips\module.zip"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path "$staging\rnk-vortex-system-optimizer" | Out-Null

foreach ($item in @('module.json','README.md','scripts','styles','templates','lang')) {
    $sp = Join-Path $src $item
    $dp = "$staging\rnk-vortex-system-optimizer\$item"
    if (Test-Path $sp) {
        if ((Get-Item $sp).PSIsContainer) { Copy-Item $sp $dp -Recurse } else { Copy-Item $sp $dp }
        Write-Host "Copied: $item"
    } else {
        Write-Host "SKIP (not found): $item"
    }
}

Remove-Item $zipOut -Force -ErrorAction SilentlyContinue
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipOut)

$size = (Get-Item $zipOut).Length
Write-Host "module.zip rebuilt: $size bytes"

$z = [System.IO.Compression.ZipFile]::OpenRead($zipOut)
$entry = $z.Entries | Where-Object { $_.FullName -match 'module\.json$' }
$reader = [System.IO.StreamReader]::new($entry.Open())
$content = $reader.ReadToEnd()
$reader.Dispose()
$z.Dispose()
$ver = ($content | ConvertFrom-Json).version
Write-Host "Version in zip: $ver"
Write-Host "DONE"
