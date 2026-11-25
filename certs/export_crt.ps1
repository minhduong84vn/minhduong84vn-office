$pfxPath = "D:\projects\gemini-office-addin\certs\localhost.pfx"
$crtPath = "D:\projects\gemini-office-addin\certs\localhost.crt"
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, "gemini123")
$bytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($crtPath, $bytes)
Write-Host "Exported: $crtPath"
