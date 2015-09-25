#!/bin/sh

if [[ $# -lt 2 ]]; then
	echo "Usage: dist.sh <built binary> <output dir>"
	exit 1
fi

mkdir -p $2 && cp $1 $2/node_ios_device_v`Release/node_module_version`.node