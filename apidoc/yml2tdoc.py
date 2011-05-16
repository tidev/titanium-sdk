#!/usr/bin/env python
# vim: set fileencoding=utf-8 :
"""
Convert new .yml docs to old .tdoc format.
Done as a stopgap measure to get docs ready for 
Titanium 1.7.0 release, before full switchover
of docs is done. (cf. TIMOB-3894)
"""

import os, sys, traceback
import optparse, yaml, markdown, re

doc_dir = os.path.abspath(os.path.dirname(__file__))
types = []

def err(msg, exit=False):
	print >> sys.stderr, msg
	if exit:
		sys.exit(1)

def get_types(path):
	result = []
	if not path.endswith('.yml'):
		err('%s is not a .yml file; skipping' % path, False)
		return result
	path = os.path.abspath(path)
	if not os.path.exists(path):
		err('%s does not exist; skipping' % path, False)
		return result
	try:
		f = open(path, 'r')
	except:
		err('Unable to open %s: %s' % (path, traceback.format_exc()), False)
		return result
	try:
		result.extend( [t for t in yaml.load_all(f)] )
	except:
		err('Parse failure in %s: %s' % (path, traceback.format_exc()), False)
		return result
	finally:
		f.close()
	return result

def is_documented_type(type_name):
	if types:
		for t in types:
			if t['name'] and t['name'] == type_name:
				return True
	return False

def ti_links(s, dblbrackets=False):
	if not '<' in s:
		return s
	pattern = r'\<(Ti[^>]+)\>'
	l = re.findall(pattern, s)
	if dblbrackets:
		front = '[['
		back = ']]'
	else:
		front = '`'
		back = '`'
	for one in l:
		s = s.replace('<' + one + '>', front + one + back)
	return s

def find_type(type_name, types):
	search_results = [t for t in types if t['name'] == type_names]
	if search_results:
		return search_results[0]
	else:
		return None

def normalize_ti_name(name):
	if name.startswith('Ti.'):
		return 'Titanium.%s' % name[3:]
	else:
		return name

def build_output_file_path(t):
	name = t['name']
	path = os.path.join(doc_dir, name.replace('.', os.sep)) + '.tdoc' # default
	# modules go in their own folder
	if 'extends' in t:
		if 'Module' in t['extends']:
			module = name.split('.')[-1]
			parent = os.path.dirname(path)
			path = os.path.join(parent, module, module + '.tdoc')
	return path

def convert_basic_info(t, f):
	lines = []
	lines.append('- namespace')
	lines.append('')
	lines.append(t['name'])
	lines.append('')
	lines.append('- type')
	lines.append('')
	if 'extends' in t:
		extends = t['extends']
		if 'Module' in extends:
			lines.append('module')
		elif 'Proxy' in extends:
			lines.append('proxy')
		elif 'View' in extends:
			lines.append('object')
			lines.append('')
			lines.append('- subtype')
			lines.append('')
			lines.append('view')
		lines.append('')
	if 'description' in t:
		lines.append('- description')
		lines.append('')
		lines.append(ti_links(t['description']))
		lines.append('')
	lines.append('- since')
	lines.append('')
	if 'since' in t:
		lines.append(t['since'])
	else:
		lines.append('0.8')
	lines.append('')
	lines.append('- platforms')
	lines.append('')
	if 'platforms' in t:
		lines.append(str(t['platforms']))
	else:
		lines.append('iphone, android, ipad')
	lines.append('')
	lines.append('')
	f.write('\n'.join(lines))

def convert_properties(t, f):
	lines = []
	lines.append('- properties')
	lines.append('')
	for p in t['properties']:
		data_type = str(p['type'])
		if data_type[0] != '[':
			data_type = '[' + data_type + ']'
		lines.append(p['name'] + data_type + ': ' + ti_links(p['description']))
	lines.append('')
	lines.append('')
	f.write('\n'.join(lines))

def convert_methods(t, f):
	lines = ['- methods', '']
	for m in t['methods']:
		lines.append(m['name'] + ': ' + ti_links(m['description'], True))
	lines.append('')
	lines.append('')
	f.write('\n'.join(lines))
	lines = []
	for m in t['methods']:
		line = '- method : %s' % m['name']
		if 'returns' in m:
			returns = str(m['returns'])
			if returns.startswith('Ti.') or returns.startswith('Titanium.'):
				returns = '`' + returns + '`'
			line += ', %s' % returns
		lines.append(line)
		if 'parameters' in m:
			for p in m['parameters']:
				data_type = 'Object'
				if 'type' in p:
					data_type = p['type']
					if is_documented_type(data_type) and (not data_type.startswith('Ti.')) and (not data_type.startswith('Titanium.')):
						data_type = 'Object'
					if data_type.startswith('Callback'):
						data_type="Function"
					if data_type.startswith('Ti.') or data_type.startswith('Titanium.'):
						data_type = '`' + data_type + '`'
					if not data_type.startswith('['):
						data_type = '[' + data_type + ']'
				description = ''
				if 'description' in p:
					description = ti_links(p['description'])
				lines.append(p['name'] + data_type + ': ' + description)
		lines.append('')
		
	lines.append('')
	f.write('\n'.join(lines))

def convert_events(t, f):
	lines = ['- events', '']
	for e in t['events']:
		lines.append(e['name'] + ': ' + ti_links(e['description'], True))
	lines.append('')
	lines.append('')
	for e in t['events']:
		line = '- event : %s' % e['name']
		lines.append(line)
		if 'properties' in e:
			for p in e['properties']:
				description = ''
				if 'description' in p:
					description = ti_links(p['description'])
				lines.append(p['name'] + ': ' + description)
		lines.append('')

	lines.append('')
	f.write('\n'.join(lines))

def convert_type(t):
	name = normalize_ti_name(t['name'])
	path = build_output_file_path(t)
	parent = os.path.dirname(path)
	if not os.path.exists(parent):
		os.makedirs(parent)
	print "Converting %s to %s" % (name, path)
	try:
		out_file = open(path, 'w')
	except:
		err('Could not open output file %s for writing: %s' % (path, traceback.format_exc()), False)
		return

	try:
		name = t['name']
		convert_basic_info(t, out_file)
		if 'properties' in t:
			convert_properties(t, out_file)
		if 'methods' in t:
			convert_methods(t, out_file)
		if 'events' in t:
			convert_events(t, out_file)

	except:
		err('Error converting type %s: %s' % (name, traceback.format_exc()), False)
		return
	finally:
		out_file.close()


def convert_types():
	for t in types:
		name = t['name']
		if name == 'Titanium' or name.startswith('Ti.') or name.startswith('Titanium.'):
			if not 'extends' in t:
				err('Skipping %s because it does not extend a type' % name)
				continue
			extends = t['extends']
			if (not 'View' in extends) and (not 'Module' in extends) and (not 'Proxy' in extends):
				err('Skipping %s because it does not extend Titanium.UI.View, Titanium.Module or Titanium.Proxy.  This script only supports inheritence of these base types.' % name)
				continue
			convert_type(t)

def convert_dir(path):
	for root, dirs, files in os.walk(os.path.abspath(path)):
		for name in files:
			if name.endswith('.yml'):
				types.extend(get_types(os.path.join(root, name)))
	convert_types()

def main(args):
	convert_dir(doc_dir)

if __name__ == "__main__":
	main(sys.argv)

