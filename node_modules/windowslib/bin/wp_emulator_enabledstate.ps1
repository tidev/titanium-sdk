# windowslib
#
# Tells Hyper-V to set the state to stopped. This script by itself cannot kill
# a running Windows Phone emulator. It doesn't have the permissions to do so.
# You should use "taskkill" to kill the "xde.exe" process which will cause the
# emulator to close, but Hyper-V won't register that the emulator is stopped.
# Run this script to let Hyper-V know you just killed the emulator.
#
# Copyright (c) 2014-2017 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

if ($args.count -eq 0) {
	echo '{"success": false, "message": "No Windows Phone emulator name specified"}'
	exit 1
}

$query = "Select * from MSVM_Computersystem where Description like '%Virtual%' AND ElementName like '" + $args[0] + ".%'"
$vm = Get-WmiObject -computername localhost -NameSpace root\Virtualization\v2 -query $query

if ($vm.__CLASS -eq 'Msvm_ComputerSystem') {
	echo "{""success"": true, ""state"": $($vm.EnabledState) }"
} else {
	echo '{"success": false, "message": "Not found"}'
}
