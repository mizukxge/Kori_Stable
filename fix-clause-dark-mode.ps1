# Fix clause library dark mode issues

$file = 'apps/web/src/routes/admin/contracts/clauses.tsx'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Fix tag filter button selected state - from bg-blue-600 to bg-primary
$content = $content -replace "bg-blue-600 text-white border-blue-600", "bg-primary text-white border-primary"

# Fix slug input - add dark mode colors (before "cancellation-policy")
$content = $content -replace 'className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"(\s+?)placeholder="e\.g\., cancellation-policy"', 'className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"$1placeholder="e.g., cancellation-policy"'

# Fix tags input - add dark mode colors (before "Add tag")
$content = $content -replace 'className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"(\s+?)placeholder="Add tag', 'className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"$1placeholder="Add tag'

# Fix selected tag display - from bg-muted to bg-primary/10 and text-primary
$content = $content -replace 'className="px-3 py-1 bg-muted text-foreground text-sm rounded-full flex items-center gap-1"', 'className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1"'

# Now handle the modal structure - need to completely replace the old modal structure with new one
# Find and replace the entire ClauseEditorModal return statement

$oldModalStart = 'return \(\s*<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">'
$newModalStart = @'
return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-start z-modal p-4 pt-12 overflow-y-auto pointer-events-none"
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl pointer-events-auto">
        <div className="bg-card rounded-lg shadow-xl">'@

# Replace the starting structure
if ($content -match $oldModalStart) {
  $content = $content -replace '<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">\s*<div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-\[90vh\] overflow-y-auto">', $newModalStart
}

# Also need to fix the closing div
$oldModalEnd = '</div>\s*</div>\s*</div>\s*\);'
$newModalEnd = @'
</div>
        </div>
      </div>
    </>
  );'@

# Replace the ending structure
if ($content -match '}}>\s*</div>\s*</div>\s*</div>\s*</$') {
  $content = $content -replace '</div>\s*</div>\s*</div>\s*\);\s*}$', $newModalEnd + "`n}"
}

# Write back
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "✓ Fixed clause library dark mode issues"
