$certPath = "D:\projects\gemini-office-addin\certs\localhost.pfx"
$password = ConvertTo-SecureString -String "gemini123" -Force -AsPlainText

$cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5) -KeyExportPolicy Exportable -KeySpec Signature

Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $password | Out-Null
Write-Host "Created PFX certificate: $certPath"
