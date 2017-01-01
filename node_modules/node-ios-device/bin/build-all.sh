#!/bin/sh

targets=(
	0.10.47 # 11
	0.12.16 # 14
	1.0.4   # 42
	1.8.4   # 43
	2.5.0   # 44
	3.3.1   # 45
	4.5.0   # 46
	5.12.0  # 47
	6.5.0   # 48
)
cwd=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
node_pre_gyp="$(dirname "$cwd")/node_modules/node-pre-gyp/bin/node-pre-gyp"
args='rebuild'

if [[ $npm_lifecycle_event == "prepublish" ]]; then
	is_publish=`$NODE -e "console.log(JSON.parse(process.env.npm_config_argv).cooked.indexOf('publish') !== -1);"`
	if [[ $is_publish == "true" ]]; then
		args="$args package publish"
	else
		exit 0
	fi
fi

if [[ $NODE == "" ]]; then
	NODE=`which node`
fi

for target in ${targets[@]}; do
	cmd="$NODE $node_pre_gyp --target=$target $args"
	echo "\nEXECUTING $cmd\n"
	$cmd
	if [[ $? != 0 ]]; then
		exit 1
	fi
done
