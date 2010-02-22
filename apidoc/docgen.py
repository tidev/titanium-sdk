#!/usr/bin/env python
#
# Copyright (c) 2010 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.
# 
import os, sys, json, re
from os.path import join, splitext, split, exists

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

ignoreFiles = ['.gitignore', '.cvsignore'];
ignoreDirs = ['.git','.svn', 'CVS'];

state = ''
buffer = ''

apis = {}
current_api = None

class API(object):
	def __init__(self,name):
		self.namespace = name
		self.description = None
		self.typestr = None
		self.returns = None
		self.methods = []
		self.properties = []
		self.events = []
		self.examples = []
		self.platforms = []
		self.since = '0.8'
		self.deprecated = None
		self.parameters = []
	def set_description(self,desc):
		self.description = desc
	def set_since(self,since):
		self.since = since
	def set_deprecated(self,version,note):
		self.deprecated = {'version':version,'reason':note}
	def set_type(self,typestr):
		self.typestr = typestr
	def set_returns(self,returns):
		self.returns = returns
	def add_method(self,key,value):
		self.methods.append({'name':key,'value':value})
	def add_property(self,key,value):
		self.properties.append({'name':key,'value':value})
	def add_event(self,key,value):
		self.events.append({'name':key,'value':value,'properties':{}})
	def add_event_property(self,event,key,value):
		for e in self.events:
			if e['name'] == event:
				e['properties'][key]=value
				return
	def add_platform(self,value):
		self.platforms.append(value)
	def add_example(self,value):
		self.examples.append(value)
	def add_parameter(self,name,typestr,desc):
		self.parameters.append({'name':name,'type':typestr,'description':desc})
	def to_json(self):
		result = {
			'methods' : self.methods,
			'properties' : self.properties,
			'events' : self.events,
			'examples' : self.examples,
			'platforms' : self.platforms,
			'description' : self.description,
			'type' : self.typestr,
			'returns' : self.returns,
			'since' : self.since,
			'deprecated' : self.deprecated,
			'parameters' : self.parameters
		}
		return result

def split_keyvalue(line):
	idx = line.find(":")
	if idx == -1:
		return None,None
	key = line[0:idx].strip()
	value = line[idx+1:].strip()
	return key,value
	
def tokenize_keyvalues(buf):
	array = []
	for line in buf.split("\n"):
		key,value = split_keyvalue(line)
		if key == None: continue
		array.append((key,value))
	return array
		
def emit_properties(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_property(tokens[0],tokens[1])
	
def emit_methods(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_method(tokens[0],tokens[1])
	
def emit_events(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_event(tokens[0],tokens[1])

def emit_namespace(line):
	global apis, current_api
	line = line.strip()
	current_api = API(line)
	apis[current_api.namespace] = current_api
	
def emit_description(line):
	current_api.set_description(line.strip())

def emit_example(line):
	current_api.add_example(line)
		
def emit_type(line):
	current_api.set_type(line.strip())

def emit_returns(line):
	current_api.set_returns(line.strip())
			
def emit_since(line):
	current_api.set_since(line.strip())

def emit_platforms(line):
	for token in line.strip().split(","):
		current_api.add_platform(token.strip())
		
def emit_deprecated(line):
	line = line.strip()
	idx = line.find(':')
	if idx == -1:
		print "[ERROR] invalid deprecation line: %s. Must be in the format [version]:[description]" % line
		sys.exit(1)
	current_api.set_deprecated(line[0:idx].strip(),line[idx+1:].strip())
	
def emit_parameters(lines):
	for line in lines.split("\n"):
		line = line.strip()
		if line == '': continue
		idx = line.find(':')
		if idx == -1:
			print "[ERROR] invalid parameters line: %s. Must be in the format [name[type]]:[description]" % line
			sys.exit(1)
		key = line[0:idx].strip()
		desc = line[idx+1:].strip()
		match = re.search('(.*)\[(.*)\]',key)
		if match == None:
			print "[ERROR] invalid parameters line: %s. Must be in the format [name[type]]:[description]" % line
			sys.exit(1)
		current_api.add_parameter(match.group(1), match.group(2), desc)
					
def emit_event_parameter(state,line):
	idx = state.find(":")
	event = state[idx+1:].strip()
	for tokens in tokenize_keyvalues(line):
		current_api.add_event_property(event,tokens[0],tokens[1])
						
def emit_buffer(line):
	global state
	if line == '': return
	
	if state == 'properties':
		emit_properties(line)
	elif state == 'methods':
		emit_methods(line)
	elif state == 'events':
		emit_events(line)
	elif state == 'namespace':
		emit_namespace(line)
	elif state == 'description':
		emit_description(line)
	elif state == 'example':
		emit_example(line)
	elif state == 'type':
		emit_type(line)
	elif state == 'returns':
		emit_returns(line)
	elif state == 'since':
		emit_since(line)
	elif state == 'platforms':
		emit_platforms(line)
	elif state == 'deprecated':
		emit_deprecated(line)
	elif state == 'parameters':
		emit_parameters(line)
	elif state.find('event : ')!=-1:
		emit_event_parameter(state,line)
	else:
		print "Huh? [%s]. current state: %s" % (line,state)
		sys.exit(1)

def start_marker(line):
	global state, buffer
	if buffer != '':
		pass
	state = line[2:].strip()
	

for root, dirs, files in os.walk(template_dir):
	for name in ignoreDirs:
		if name in dirs:
			dirs.remove(name)	# don't visit ignored directories			  
	for file in files:
		if splitext(file)[-1] != '.tdoc' or file=='template.tdoc':
			continue
		from_ = join(root, file)
		content = open(from_).readlines()
		buffer = ''
		for line in content:
			ln = line.strip()
			if ln=='': continue
			if ln[0:1] == '#':
				continue
			if ln[0:1] == '-':
				emit_buffer(buffer)
				buffer = ''
				start_marker(ln)
			else:
				buffer+='%s\n' % ln
		emit_buffer(buffer)
					  
result = {}
for key in apis:
	result[key] = apis[key].to_json()
print json.dumps(result,sort_keys=True,indent=4)
