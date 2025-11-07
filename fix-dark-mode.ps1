# Dark Mode Color Fix Script
# Applies semantic color replacements across admin route files

$files = @(
    "apps\web\src\routes\admin\proposals\new.tsx",
    "apps\web\src\routes\admin\proposals\dashboard.tsx",
    "apps\web\src\routes\admin\invoices\index.tsx",
    "apps\web\src\routes\admin\invoices\new.tsx",
    "apps\web\src\routes\admin\contracts\index.tsx",
    "apps\web\src\routes\admin\contracts\dashboard.tsx",
    "apps\web\src\routes\admin\contracts\templates.tsx",
    "apps\web\src\routes\admin\contracts\clauses.tsx"
)

$replacements = @{
    'text-gray-900' = 'text-foreground'
    'text-gray-800' = 'text-foreground'
    'text-gray-700' = 'text-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    'bg-gray-50' = 'bg-background'
    'bg-gray-100' = 'bg-muted'
    'bg-gray-200' = 'bg-muted'
    'border-gray-300' = 'border-input'
    'border-gray-200' = 'border-border'
    'focus:ring-blue-500' = 'focus:ring-ring'
    'divide-gray-200' = 'divide-border'
    'hover:bg-gray-50' = 'hover:bg-muted'
}

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file

    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow

        $content = Get-Content $fullPath -Raw
        $originalContent = $content

        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace $old, $new
        }

        # Special handling for select elements - add bg-background
        $content = $content -replace '(className="[^"]*px-3 py-2 border border-input[^"]*)(")' , '$1 bg-background$2'

        if ($content -ne $originalContent) {
            Set-Content $fullPath $content -NoNewline
            Write-Host "  Updated successfully" -ForegroundColor Green
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Dark mode fixes applied successfully!" -ForegroundColor Green
