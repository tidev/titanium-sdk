# windowslib
#
# Detects all Windows Phone emulators and if they are running. If a specific
# Windows Phone emulator has never been launched, then it will NOT show up.
# If the emulator is running, it will also display the process id.
#
# Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

$query = "Select * from MSVM_Computersystem where Description like '%Virtual%'"
if ($args.count -gt 0) {
	$query = $query + " AND ElementName like '" + $args[0] + ".%'"
}

# Enabled States:
#      2 = "Running"
#      3 = "Stopped"
#  32768 = "Paused"
#  32769 = "Suspended"
#  32270 = "Starting"
#  32771 = "Snapshotting"
#  32773 = "Saving"
#  32774 = "Stopping"

get-wmiobject -computername localhost -Namespace root\Virtualization\v2 -query $query |
    format-table -autosize -HideTableHeaders @{Label="VM Name"; expression={$_.ElementName}}, EnabledState, ProcessID

exit