Add-Type -AssemblyName System.Drawing

$bitmap = New-Object System.Drawing.Bitmap 128, 128
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.TextRenderingHint = 'AntiAliasGridFit'

$orange = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 107, 0))
$graphics.FillEllipse($orange, 0, 0, 128, 128)

$font = New-Object System.Drawing.Font 'Segoe UI', 44, ([System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = 'Center'
$format.LineAlignment = 'Center'
$rect = New-Object System.Drawing.RectangleF 0, 0, 128, 128
$graphics.DrawString('NJ', $font, [System.Drawing.Brushes]::White, $rect, $format)

$outputPath = Join-Path $PSScriptRoot '..\public\nzolanet-logo.png'
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Created $outputPath"
