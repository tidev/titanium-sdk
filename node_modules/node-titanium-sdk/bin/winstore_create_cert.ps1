$id = $Args[0]
$certPath = $Args[1]
$makeCertArgs ='/n "CN=' + $id + ', O=Titanium, OU=Windows Store Applications" /r /h 0 /eku "1.3.6.1.5.5.7.3.3,1.3.6.1.4.1.311.10.3.13" /e "11/10/2014" /sr localMachine /ss TrustedPeople /sv "' + $certPath + '.pvk" "' + $certPath + '.cer"'

# Launch the process and wait for it to finish
try
{
	$AdminProcess = Start-Process "MakeCert" -Verb RunAs -ArgumentList $makeCertArgs -PassThru
}
catch
{
	PrintMessageAndExit $Error[0] # Dump details about the last error
}

while (!($AdminProcess.HasExited))
{
	Start-Sleep -Seconds 2
}