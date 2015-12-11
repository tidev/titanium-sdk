$AppPackagePath = $Args[0]

$shell = new-object -com shell.application
$item = get-item $AppPackagePath
$zipFilePath = $item.FullName + ".zip"

$directory = $item.Directory.FullName
Copy-Item $item $zipFilePath
$manifest = @{ "Name" = "AppxManifest.xml" }
$manifest.Path = Join-Path $directory $manifest.Name
$manifest.File = $shell.NameSpace($zipFilePath).Items() | ? { $_.Name -eq $manifest.Name }
$shell.Namespace($directory).CopyHere($manifest.File)
$manifest.Xml = [xml](get-content $manifest.Path)

Remove-Item $zipFilePath
Remove-Item $manifest.Path

$manifest.Xml.Package.Identity.Name
