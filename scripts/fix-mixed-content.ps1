$ErrorActionPreference = 'Stop'
$root = Resolve-Path '.'
$files = Get-ChildItem -Path $root -Recurse -File -Include '*.json', '*.ts' |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\' }

# 1. http -> https для хостов, поддерживающих TLS
$upgrades = @(
    @{ pattern = 'http://amra-turistik\.ru'; replacement = 'https://amra-turistik.ru' }
    @{ pattern = 'http://rt\.plus';          replacement = 'https://rt.plus' }
)

# 2. Удалить целиком элементы массива с http://zelsoft.rt.plus
#    (нет HTTPS, иначе будет Mixed Content). Формат: одинарные/двойные кавычки + запятая.
$dropPattern = '(?m)^[ \t]*[''"]http://zelsoft\.rt\.plus/[^''"]*[''"],?[ \t]*\r?\n'

$encoding = New-Object System.Text.UTF8Encoding($false)

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $original = $content

    foreach ($u in $upgrades) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $u.pattern, $u.replacement)
    }
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $dropPattern, '')

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content, $encoding)
        Write-Host ('updated: ' + $f.FullName)
    }
}
