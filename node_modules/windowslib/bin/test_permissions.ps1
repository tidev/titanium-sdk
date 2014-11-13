# windowslib
#
# Running this script will print "success" if execution policy for PowerShell
# allows remote signed scripts.
#
# To enable remote signed scripts, run the following for a privileged
# PowerShell terminal:
#    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#
# To restore the execution policy, run:
#    Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser
#
# Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

echo "success"
exit