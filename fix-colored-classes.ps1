# Fix colored utility classes for dark mode
$baseDir = "E:\Applications\kori_web_stable\apps\web\src"
$files = Get-ChildItem -Path $baseDir -Filter "*.tsx" -Recurse
$totalFixed = 0

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Encoding UTF8 | Out-String
        if (-not $content) { continue }
        $originalContent = $content

        # Text colors - convert to semantic or add dark mode variants
        $content = $content -replace '\btext-blue-600\b', 'text-primary'
        $content = $content -replace '\btext-blue-500\b', 'text-primary'
        $content = $content -replace '\btext-blue-700\b', 'text-primary'
        $content = $content -replace '\btext-blue-800\b', 'text-primary dark:text-primary'

        $content = $content -replace '\btext-green-600\b', 'text-success'
        $content = $content -replace '\btext-green-500\b', 'text-success'
        $content = $content -replace '\btext-green-700\b', 'text-success'
        $content = $content -replace '\btext-emerald-600\b', 'text-success'

        $content = $content -replace '\btext-red-600\b', 'text-destructive'
        $content = $content -replace '\btext-red-500\b', 'text-destructive'
        $content = $content -replace '\btext-red-700\b', 'text-destructive'

        $content = $content -replace '\btext-yellow-600\b', 'text-warning'
        $content = $content -replace '\btext-yellow-500\b', 'text-warning'
        $content = $content -replace '\btext-orange-600\b', 'text-warning'

        $content = $content -replace '\btext-purple-600\b', 'text-secondary'
        $content = $content -replace '\btext-purple-500\b', 'text-secondary'

        # Hover text colors
        $content = $content -replace '\bhover:text-blue-800\b', 'hover:text-primary'
        $content = $content -replace '\bhover:text-blue-700\b', 'hover:text-primary'

        if ($content -ne $originalContent) {
            $content | Set-Content -Path $file.FullName -NoNewline -Encoding UTF8
            $totalFixed++
            Write-Host "Fixed: $($file.Name)"
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Complete - Fixed $totalFixed files"
