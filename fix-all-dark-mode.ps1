# Comprehensive Dark Mode Fix Script
$baseDir = "E:\Applications\kori_web_stable\apps\web\src"
$files = Get-ChildItem -Path $baseDir -Filter "*.tsx" -Recurse
$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    $originalContent = $content

    # Background colors
    $content = $content -replace '\bbg-white\b', 'bg-card'
    $content = $content -replace '\bbg-gray-50\b', 'bg-background'
    $content = $content -replace '\bbg-gray-100\b', 'bg-muted'
    $content = $content -replace '\bbg-gray-200\b', 'bg-muted'
    $content = $content -replace '\bbg-gray-300\b', 'bg-muted'

    # Text colors
    $content = $content -replace '\btext-black\b', 'text-foreground'
    $content = $content -replace '\btext-gray-900\b', 'text-foreground'
    $content = $content -replace '\btext-gray-800\b', 'text-foreground'
    $content = $content -replace '\btext-gray-700\b', 'text-foreground'
    $content = $content -replace '\btext-gray-600\b', 'text-muted-foreground'
    $content = $content -replace '\btext-gray-500\b', 'text-muted-foreground'
    $content = $content -replace '\btext-gray-400\b', 'text-muted-foreground'

    # Border colors
    $content = $content -replace '\bborder-gray-300\b', 'border-input'
    $content = $content -replace '\bborder-gray-200\b', 'border-border'
    $content = $content -replace '\bborder-white\b', 'border-border'
    $content = $content -replace '\bdivide-gray-200\b', 'divide-border'

    # Ring/Focus colors
    $content = $content -replace '\bfocus:ring-blue-500\b', 'focus:ring-ring'
    $content = $content -replace '\bfocus:ring-blue-600\b', 'focus:ring-ring'
    $content = $content -replace '\bring-blue-500\b', 'ring-ring'

    # Hover states
    $content = $content -replace '\bhover:bg-gray-50\b', 'hover:bg-muted'
    $content = $content -replace '\bhover:bg-gray-100\b', 'hover:bg-muted'
    $content = $content -replace '\bhover:bg-white\b', 'hover:bg-card'

    # Placeholder colors
    $content = $content -replace '\bplaceholder-gray-400\b', 'placeholder-muted-foreground'
    $content = $content -replace '\bplaceholder-gray-500\b', 'placeholder-muted-foreground'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFixed++
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Complete - Fixed $totalFixed files"
