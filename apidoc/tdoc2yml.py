#!/usr/bin/env python
# vim: set noexpandtab fileencoding=utf-8 :
"""
Convert old .tdoc docs to new .yml format.
1. Get the jsca by running docgen.py
2. Use the jsca to generate the yaml.
"""

import os, sys, traceback, re
import optparse, yaml, markdown
import docgen
try:
	import json
except:
	import simplejson as json

types = []
doc_dir = os.path.abspath(os.path.dirname(__file__))
OUTPUT_DIR_OVERRIDE = None
skip_methods = (
	'addEventListener',
	'removeEventListener',
	'fireEvent')
skip_properties = []
view_methods = []
view_properties = []
view_events = []
indent = "    "

def clean_type(t):
	if ',' in t:
		t = '[%s]' % t
	if t.lower() == 'array':
		t = 'Array<Object>'
	if t.lower() == 'function':
		t = 'Callback'
	return t

def skip_property(p, t):
	if p['name'] in skip_properties:
		return True
	if is_view(t) and t['name'] != 'Titanium.UI.View':
		return p['name'] in view_properties
	return False

def skip_method(m, t):
	if m['name'] in skip_methods:
		return True
	if is_view(t) and t['name'] != 'Titanium.UI.View':
		return m['name'] in view_methods
	return False

def skip_event(e, t):
	if is_view(t) and t['name'] != 'Titanium.UI.View':
		return e['name'] in view_events

def err(msg, exit=False):
	print >> sys.stderr, "[ERROR] %s" % msg
	if exit:
		sys.exit(1)

def info(msg):
	print "[INFO] %s" % msg

def warn(msg):
	print >> sys.stderr, "[WARN] %s" % msg

def is_module(t):
	name = t['name']
	if name in docgen.apis:
		return (docgen.apis[name].typestr == 'module')
	for tt in types:
		if tt['name'].startswith(t['name']) and tt['name'] != t['name']:
			return True
	return False

def is_view(t):
	if 'properties' in t:
		props = [p['name'] for p in t['properties']]
		return 'height' in props and 'width' in props and 'borderColor' in props
	return False

def fetch_view_attributes():
	global view_methods
	global view_properties
	global view_events
	view_type = [t for t in types if t['name'] == 'Titanium.UI.View'][0]
	view_methods = [m['name'] for m in view_type['methods']]
	view_properties = [p['name'] for p in view_type['properties']]
	view_events = [e['name'] for e in view_type['events']]

def is_view_method(method_name):
	if len(view_methods) == 0:
		fetch_view_attributes()
	return method_name in view_methods

def is_view_event(event_name):
	if len(view_events) == 0:
		fetch_view_attributes()
	return event_name in view_events

def is_view_property(property_name):
	if len(view_properties) == 0:
		fetch_view_attributes()
	return property_name in view_properties

def prepare_free_text(s, indent_level=0):
	ind = ''
	for i in range(indent_level + 1):
		ind += indent
	# replace weird backslashes at EOL, which we have in a few TDOCs.
	prog = re.compile(r'\\$', re.M)
	s = prog.sub('', s)
	# `Titanium.XX.XXXX`
	pattern = r'`Ti[^`]*\.[^`]*`'
	matches = re.findall(pattern, s)
	if matches:
		for match in matches:
			s = s.replace(match, '<' + match[1:-1] + '>')
	# [[Titanium.XX.XXXX]]
	pattern = r'\[\[Ti[^\]]*\.[^\]]*\]\]'
	matches = re.findall(pattern, s)
	if matches:
		for match in matches:
			s = s.replace(match, '<' + match[2:-2] + '>')
	# if there are newlines in the TDOC, need to push lines 2-n in by indent
	prog = re.compile(r'\n', re.M)
	if prog.search(s):
		s = prog.sub('\n%s' % ind, s)

	# test it
	y = 'description: %s' % s
	try:
		test = yaml.load(y)
	except:
		# Break the line with YAML-recognized vertical bar, which forces the whole
		# thing to be treated as string and probably gets rid of parse error.
		s = '|\n%s%s' % (ind, s)
	return s


def build_output_path(t):
	path = OUTPUT_DIR_OVERRIDE or doc_dir
	name = t['name']
	qualifier = ".".join(name.split('.')[:-1])
	type_name = name.split('.')[-1]
	if is_module(t):
		path = os.path.join(path, qualifier.replace('.', os.sep), type_name, type_name + '.yml')
	else:
		path = os.path.join(path, qualifier.replace('.', os.sep), type_name + '.yml')
	if not os.path.exists(os.path.dirname(path)):
		os.makedirs(os.path.dirname(path))
	return path

# writeline
def wl(f, line):
	f.write(line + "\n")

def convert_basic_info(t, f):
	module = is_module(t)
	view = is_view(t)
	extends = 'Titanium.Proxy'
	if module:
		extends = 'Titanium.Module'
	elif view and t['name'] != "Titanium.UI.View":
		extends = 'Titanium.UI.View'
	wl(f, '---')
	wl(f, 'name: %s' % t['name'])
	desc = prepare_free_text(t['description'].strip())
	wl(f, 'description: %s' % prepare_free_text(t['description'].strip()))
	wl(f, 'extends: %s' % extends)
	since = '"0.8"'
	if 'since' in t:
		since = '"' + t['since'][0]['version'] + '"'
	wl(f, 'since: %s' % since)

# t=type, p=method param, f=file
def convert_parameter(t, p, f):
	wl(f, "%s  - name: %s" % (indent, p['name']))
	ind = "%s%s" % (indent,indent)
	if 'description' in p:
		wl(f, "%sdescription: %s" % (ind, prepare_free_text(p['description'].strip(), 2)))
	if 'type' in p:
		wl(f, "%stype: %s" % (ind, clean_type(p['type'])))

# t=type, m=method, f=file
def convert_parameters(t, m, f):
	if not 'parameters' in m:
		return
	wl(f, "%sparameters:" % indent)
	for p in m['parameters']:
		convert_parameter(t, p, f)

# t=type, m=method, f=file
def convert_method(t, m, f):
	line = '  - name: %s' % m['name']
	wl(f, line)
	wl(f, "%sdescription: %s" % (indent, prepare_free_text(m['description'].strip(), 1)))
	if 'returnTypes' in m:
		returns = m['returnTypes'][0]
		wl(f, "%sreturns:\n%s%stype: %s" % (indent, indent, indent, clean_type(returns['type'])))
	convert_parameters(t, m, f)

def convert_methods(t, f):
	if not 'functions' in t or len(t['functions']) == 0:
		return
	wrote_header = False
	for func in t['functions']:
		if skip_method(func, t):
			continue
		if not wrote_header:
			wrote_header = True
			wl(f, 'methods:')
		convert_method(t, func, f)

# t=type, e=event, p=event property, f=file
def convert_event_property(t, e, p, f):
	wl(f, '%s  - name: %s' % (indent, p['name']))
	ind = '%s%s' % (indent, indent)
	if 'description' in p:
		wl(f, '%sdescription: %s' % (ind, prepare_free_text(p['description'].strip(), 3)))
	if 'type' in p:
		wl(f, '%stype: %s' % (ind, clean_type(p['type'])))

# t=type, e=event, f=file
def convert_event_properties(t, e, f):
	if not 'properties' in e or len(e['properties']) == 0:
		return
	wl(f, "%sproperties:" % (indent))
	for p in e['properties']:
		convert_event_property(t, e, p, f)

# t=type, e=event, f=file
def convert_event(t, e, f):
	wl(f, '  - name: %s' % e['name'])
	if 'description' in e:
		wl(f, '%sdescription: %s' % (indent, prepare_free_text(e['description'].strip(), 1)))
	if 'properties' in e:
		convert_event_properties(t, e, f)

def convert_events(t, f):
	if not 'events' in t or len(t['events']) == 0:
		return
	wl(f, 'events:')
	for event in t['events']:
		if skip_event(event, t):
			continue
		convert_event(t, event, f)

# t=type, p=property, f=file
def convert_property(t, p, f):
	line = '  - name: %s' % p['name']
	wl(f, line)
	wl(f, "%sdescription: %s" % (indent, prepare_free_text(p['description'].strip(), 1)))
	if 'type' in p:
		wl(f, "%stype: %s" % (indent, clean_type(p['type'])))

def convert_properties(t, f):
	if not 'properties' in t or len(t['properties']) == 0:
		return
	wrote_header = False
	for p in t['properties']:
		if skip_property(p, t):
			continue
		if not wrote_header:
			wrote_header = True
			wl(f, 'properties:')
		convert_property(t, p, f)


def convert_type(t):
	output_path = build_output_path(t)
	f = open(output_path, 'w')
	try:
		info('Writing out %s' % output_path)
		convert_basic_info(t, f)
		convert_methods(t, f)
		convert_events(t, f)
		convert_properties(t, f)
		if 'remarks' in t and len(t['remarks'])>0:
			wl(f, 'notes: %s' % prepare_free_text(t['remarks'][0].strip()))
		if 'examples' in t and len(t['examples'])>0:
			examples = ''
			for example in t['examples']:
				examples += example['name'] + '\n\n' + example['code']
			wl(f, 'examples: %s' % prepare_free_text(examples))

	finally:
		f.close()

def convert_types():
	for t in types:
		convert_type(t)

def main(args):
	docgen.suppress_htmlerize = True
	docgen.process_tdoc()
	jsca = docgen.produce_jsca({}, False)
	global types
	types = json.loads(jsca)['types']
	convert_types()

if __name__ == "__main__":
	main(sys.argv)

