import json
#!/usr/bin/env python
#
# Copyright (c) 2010 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.

import os
import types

def write(f, property, value):
	f.write("- %s\n%s\n\n" % (property, value))

def write_yaml_line(f, property, value, escape=True):
	if escape:
		f.write("%s: %s\n" % (property, escape_yaml(value)))
	else:
		f.write("%s: %s\n" % (property, value))

def to_version(num):
	if num.count('.') < 2:
		num += ".0"
	return num

def escape_yaml(value):
	if value.find('\'') != -1 or value.find('"') != -1 or value.find(':') != -1:
		value = '"%s"' % value.replace('"', '\\"')
	return value

def write_yaml(path, key, data):
	f = open(path, 'w')
	f.write("---\n")
	write_yaml_line(f, "namespace", key)

	if 'property' in data and data['property'] == True:
		atype = "property"
	elif 'method' in data and data['method'] == True:
		atype = "method"
	elif 'object' in data and data['object'] == True:
		atype = "object"
	else:
		atype = "module"
	write_yaml_line(f, "type", atype)

	if 'description' in data:
		description = data['description']
	else:
		description = "No description provided." # :(
	write_yaml_line(f, "description", description)

	if 'since' in data:
		since = to_version(data['since'])
	else:
		since = "0.8.5 or earlier" # :(
	write_yaml_line(f, "since", since)

	if 'deprecated' in data and data['deprecated'] == True:
		write_yaml_line(f, "deprecated", "Since 0.8.5 or ealier.")

	if 'platforms' in data:
		platforms = data['platforms']
		if type(platforms) == types.StringType or \
			type(platforms) == types.UnicodeType:
			platforms = platforms.split('|')
		
		write_yaml_line(f, "platforms", str([str(x) for x in platforms]), escape=False)

	if atype == 'property' or atype == 'method':
		if 'returns' in data and data['returns']:
			returns = data['returns']['type']
		else:
			returns = "String" # :(
		write_yaml_line(f, "returns", returns)

	if atype == 'method':
		f.write("parameters: ")

		if len(data['arguments']) == 0:
			f.write('[]')
		f.write('\n')
		for param in data['arguments']:
			if 'optional' in param and param['optional'] == True:
				param['description'] = "(optional) " + param['description']
			f.write('    - [%s, %s, %s]\n' % (
				param['type'].replace("type=", ""),
				param['name'].replace("type=", ""),
				escape_yaml(param['description'])))
			
	f.close()


#def write_tdoc(path, key, data):
#	f = open(path, 'w')
#	write(f, "namespace", key)
#
#	if 'property' in data and data['property'] == True:
#		type = "property"
#	elif 'method' in data and data['method'] == True:
#		type = "method"
#	else:
#		type = "module"
#	write(f, "type", type)
#
#	if 'description' in data:
#		description = data['description']
#	else:
#		description = "String" # :(
#	write(f, "description", description)
#
#	if 'since' in data:
#		since = data['since']
#	else:
#		since = "0.8" # :(
#	write(f, "since", since)
#
#	if 'deprecated' in data and data['deprecated'] == True:
#		write(f, "deprecated", "0.9:")
#
#	if 'platforms' in data:
#		write(f, "platforms", data['platforms'])
#
#
#	if type == 'property' or type == 'method':
#		if 'returns' in data and data['returns']:
#			returns = data['returns']['type']
#		else:
#			returns = "String" # :(
#		write(f, "returns", returns)
#
#	if type == 'method':
#		f.write("- parameters\n")
#		for param in data['arguments']:
#			if 'optional' in param and param['optional'] == True:
#				param['description'] = "(optional) " + param['description']
#			f.write('%s[%s]: %s\n' % (
#				param['name'],
#				param['type'].replace("type=", ""),
#				escape_yaml(param['description'])))
#			
#	f.close()

def to_path(key, data):
	parts = key.split('.')
	path = "out/" + "/".join(parts[:-1])
	if not os.path.exists(path):
		os.makedirs(path)

	path = os.path.join(path, parts[-1])
	#write_tdoc(path + '.tdoc', key, data)
	write_yaml(path + '.yml', key, data)

data = json.loads(open('apicoverage.json').read())
for key in data:
	if len(key) > 0:
		real_key = "Titanium." + key.strip()
	else:
		real_key = "Titanium"
	to_path(real_key, data[key])

	for sub_key in data[key]:
		if type(data[key][sub_key]) != types.DictType:
			continue

		building = ""
		if sub_key.find(".") != -1:
			for part in sub_key.split(".")[:-1]:
				building += part
				print real_key + "." + building.strip()
				to_path(real_key + "." + building.strip(), {'object': True})
				building += "."

		real_sub_key = real_key + "." + sub_key.strip()
		to_path(real_sub_key, data[key][sub_key])
