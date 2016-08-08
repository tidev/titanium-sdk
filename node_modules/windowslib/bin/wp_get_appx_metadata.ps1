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
$manifest.File = $shell.NameSpace($zipFilePath).Items() | ? { $_.Name -eq $manifest.Name }
$shell.Namespace($directory).CopyHere($manifest.File)
$manifest.Xml = [xml](get-content $manifest.Path)

Remove-Item $zipFilePath
Remove-Item $manifest.Path

$var=@($manifest.Xml.Package.Identity.Name,$manifest.Xml.Package.PhoneIdentity.PhoneProductId)[![String]::IsNullOrEmpty($manifest.Xml.Package.PhoneIdentity.PhoneProductId)]
$var
