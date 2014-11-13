# windowslib
#
# Generates a certificate for Windows Store apps.
#
# Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

$id = $Args[0]
$expires = $Args[1]
$certPath = $Args[2]
$makeCertArgs ='/n "CN=' + $id + ', O=Titanium, OU=Windows Store Applications" /r /h 0 /eku "1.3.6.1.5.5.7.3.3,1.3.6.1.4.1.311.10.3.13" /e "' + $expires + '" /sr localMachine /ss TrustedPeople /sv "' + $certPath + '.pvk" "' + $certPath + '.cer"'

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