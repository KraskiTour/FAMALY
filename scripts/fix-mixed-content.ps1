$ErrorActionPreference = 'Stop'
$root = Resolve-Path '.'
$files = Get-ChildItem -Path $root -Recurse -File -Include '*.json', '*.ts' |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\' }

$pattern = 'http://amra-turistik\.ru'
$replacement = 'https://amra-turistik.ru'
$encoding = New-Object System.Text.UTF8Encoding($false)

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName)
    if ($content -match $pattern) {
        $new = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
        [System.IO.File]::WriteAllText($f.FullName, $new, $encoding)
        Write-Host ('updated: ' + $f.FullName)
    }
}
