Add-Type -assembly "system.io.compression.filesystem"
$AppPackagePath = $Args[0]

$shell = new-object -com shell.application
$item = get-item $AppPackagePath
$zipFilePath = $item.FullName + ".zip"

$directory = $item.Directory.FullName
Copy-Item $item $zipFilePath

if ($item.extension -eq ".appxbundle") {
	$appxName = $item.Name -replace ".appxbundle", ".appx"
	$appxName = $appxName -replace "x86", "Win32"
	$appxFileEntry = $shell.NameSpace($zipFilePath).Items() | ? { $_.Name -eq $appxName }
	$shell.Namespace($directory).CopyHere($appxFileEntry)

	Remove-Item $zipFilePath
	$appFile = Join-Path $directory $appxName
	$zipFilePath = $appFile + ".zip"
	Copy-Item $appFile $zipFilePath
	Remove-Item $appFile
}

$manifest = @{ "Name" = "AppxManifest.xml" }
$manifest.Path = Join-Path $directory $manifest.Name

$zip = [io.compression.zipfile]::OpenRead($zipFilePath)
$file = $zip.Entries | where-object { $_.Name -eq $manifest.Name}
$stream = $file.Open()

$reader = New-Object IO.StreamReader($stream)
$text = $reader.ReadToEnd()
$text | Out-File -filepath  $manifest.Path -Force

$manifest.Xml = [xml](get-content $manifest.Path)


$reader.Close()
$stream.Close()
$zip.Dispose()

Remove-Item $zipFilePath
Remove-Item $manifest.Path


$var=@($manifest.Xml.Package.Identity.Name,$manifest.Xml.Package.PhoneIdentity.PhoneProductId)[![String]::IsNullOrEmpty($manifest.Xml.Package.PhoneIdentity.PhoneProductId)]
$var
