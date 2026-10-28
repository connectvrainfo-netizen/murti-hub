Add-Type -AssemblyName System.Drawing

function Crop-Image {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [int]$TargetWidth = 0,
        [int]$TargetHeight = 0
    )

    $src = [System.Drawing.Image]::FromFile($SourcePath)
    
    # Boundary clamps
    if ($X + $Width -gt $src.Width) { $Width = $src.Width - $X }
    if ($Y + $Height -gt $src.Height) { $Height = $src.Height - $Y }
    
    if ($TargetWidth -eq 0 -or $TargetHeight -eq 0) { 
        $TargetWidth = $Width 
        $TargetHeight = $Height 
    }

    $rect = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
    $dest = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $TargetWidth, $TargetHeight)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Generated: $DestPath"
}

function Center-Square-Crop {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Size = 500
    )
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $dim = [Math]::Min($src.Width, $src.Height)
    $x = [int](($src.Width - $dim) / 2)
    $y = [int](($src.Height - $dim) / 2)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $dim, $dim)
    
    $dest = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Square Crop Generated: $DestPath"
}

# 1. Process 1792047020340.png (896x1190) -> 3x3 grid (each ~298 x 396 natural)
$gridImg = "MURTI IMG AI\1792047020340.png"
Crop-Image $gridImg "images/products/shivling-sheshnaag.png" 0 0 298 396 0 0
Crop-Image $gridImg "images/products/sai-baba-bust.png" 299 0 298 396 0 0
Crop-Image $gridImg "images/products/saint-bust.png" 598 0 298 396 0 0

Crop-Image $gridImg "images/products/bal-ganesha-flute.png" 0 397 298 396 0 0
Crop-Image $gridImg "images/products/black-shivling-rudraksha.png" 299 397 298 396 0 0
Crop-Image $gridImg "images/products/standing-shiva-trishul.png" 598 397 298 396 0 0

Crop-Image $gridImg "images/products/parvati-lakshmi.png" 0 794 298 396 0 0
Crop-Image $gridImg "images/products/standing-sai-baba.png" 299 794 298 396 0 0
Crop-Image $gridImg "images/products/nandi-bull.png" 598 794 298 396 0 0

# 2. Deity Category Icons (square crops for deity-arch-bar)
# Navratri Drop: Durga on Lion (from 1792047727560.png)
Crop-Image "MURTI IMG AI\1792047727560.png" "images/categories/navratri-drop@2x.png" 250 50 550 550 200 200
# Shiva: Standing Shiva (from grid or standing shiva)
Crop-Image $gridImg "images/categories/shiva@2x.png" 620 410 260 260 200 200
# Hanuman: Kneeling Pranam Hanuman (from 1792048057542.png)
Crop-Image "MURTI IMG AI\1792048057542.png" "images/categories/hanuman@2x.png" 280 200 450 450 200 200
# Krishna: Ganesha/Ram Darbar / Bal Krishna (from 1792047286079.png)
Crop-Image "MURTI IMG AI\1792047286079.png" "images/categories/ram@2x.png" 430 110 320 320 200 200
# Ganpati: Ganesha trio center (from 1792047229323.png)
Crop-Image "MURTI IMG AI\1792047229323.png" "images/categories/ganpati@2x.png" 250 230 420 420 200 200
# Krishna: Radha Krishna with flute
Crop-Image "MURTI IMG AI\1792048057542.png" "images/categories/krishna@2x.png" 690 415 200 200 200 200
# Durga & Shakti: Maa Durga face & crown
Crop-Image "MURTI IMG AI\1792047727560.png" "images/categories/durga-shakti@2x.png" 340 70 330 330 200 200
# Murugan / Dattatreya: from 1792047945233.png
Crop-Image "MURTI IMG AI\1792047945233.png" "images/categories/murugan@2x.png" 250 20 460 460 200 200
# Hand Paint: Hand-painted gold ornate deity from 1792047020340.png (y starts around 794)
Crop-Image $gridImg "images/categories/hand-paint@2x.png" 35 805 230 230 200 200
# Sai Baba Category
Crop-Image $gridImg "images/categories/saibaba@2x.png" 320 20 250 250 200 200

# 3. High quality product images
Center-Square-Crop "MURTI IMG AI\1792047229323.png" "images/products/ganesha-trio.png" 600
Center-Square-Crop "MURTI IMG AI\1792047286079.png" "images/products/ram-darbar.png" 600
Center-Square-Crop "MURTI IMG AI\1792047614351.png" "images/products/hanuman-sanjeevani.png" 600
Center-Square-Crop "MURTI IMG AI\1792047727560.png" "images/products/durga-sherawali.png" 600
Center-Square-Crop "MURTI IMG AI\1792047837783.png" "images/products/golden-kalash-shikhar.png" 600
Center-Square-Crop "MURTI IMG AI\1792047945233.png" "images/products/dattatreya-kamadhenu.png" 600
Center-Square-Crop "MURTI IMG AI\1792048057542.png" "images/products/hanuman-pranam.png" 600
Center-Square-Crop "MURTI IMG AI\1792047369156.png" "images/products/brass-shikhar-kalash.png" 600

# 4. Editorial & Banners
Copy-Item "MURTI IMG AI\1792047035632.png" "images/banners/hero-most-loved.png"
Copy-Item "MURTI IMG AI\1792047286079.png" "images/banners/hero-new-arrivals.png"
Copy-Item "MURTI IMG AI\1792047727560.png" "images/editorial/durga-feature.png"
Copy-Item "MURTI IMG AI\1792047614351.png" "images/editorial/hanuman-feature.png"
Copy-Item "MURTI IMG AI\1792047837783.png" "images/editorial/kalash-craft.png"

Write-Host "All images processed successfully!"
