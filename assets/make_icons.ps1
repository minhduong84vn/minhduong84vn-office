Add-Type -AssemblyName System.Drawing

function Make-GeminiIcon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(66, 133, 244), [System.Drawing.Color]::FromArgb(155, 114, 203), 45)
    $g.FillEllipse($brush, 1, 1, $size - 2, $size - 2)
    
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(1.5, $size / 10))
    $mid = [float]($size / 2)
    $arm = [float]($size / 3.5)
    $g.DrawLine($pen, $mid, $mid - $arm, $mid, $mid + $arm)
    $g.DrawLine($pen, $mid - $arm, $mid, $mid + $arm, $mid)
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $path"
}

Make-GeminiIcon 16 'D:\projects\gemini-office-addin\assets\icon-16.png'
Make-GeminiIcon 32 'D:\projects\gemini-office-addin\assets\icon-32.png'
Make-GeminiIcon 64 'D:\projects\gemini-office-addin\assets\icon-64.png'
Make-GeminiIcon 80 'D:\projects\gemini-office-addin\assets\icon-80.png'
