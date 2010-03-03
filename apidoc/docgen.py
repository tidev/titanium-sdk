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
import copy

try:
	from mako.template import Template
	from mako import exceptions
except:
	print "Crap, you don't have mako!\n"
	print "Easy install that bitch:\n"
	print ">  easy_install Mako"
	print
	sys.exit(1)

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
		self.name = self.get_name()
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
		self.notes = None
	def get_name(self):
		loc = self.namespace.rfind('.')
		if loc == -1: # Top-level namespace
			return self.namespace
		return self.namespace[loc + 1:]
	def get_parent_name(self):
		loc = self.namespace.rfind('.')
		if loc == -1:
			return None
		return self.namespace[:loc]
	def set_description(self,desc):
		self.description = desc
	def set_since(self,since):
		self.since = since
	def set_deprecated(self,version,note):
		self.deprecated = {'version':version,'reason':note}
	def set_type(self,typestr):
		self.typestr = typestr

		parent = get_api(self.get_parent_name())
		if not parent:
			return
		lowered = typestr.lower()
		if lowered == "function" or lowered == "method":
			parent.methods.append(self)
		else:
			parent.properties.append(self)
	def set_returns(self,returns):
		self.returns = returns
	def set_notes(self,notes):
		self.notes = notes
	def add_method(self,key,value):
		self.methods.append({'name':key,'value':value})
	def add_property(self,key,typev,value):
		self.properties.append({'name':key,'type':typev,'value':value})
	def add_event(self,key,value):
		self.events.append({'name':key,'value':value,'properties':{}})
	def add_event_property(self,event,key,value):
		for e in self.events:
			if e['name'] == event:
				e['properties'][key]=value
				return
	def add_platform(self,value):
		self.platforms.append(value)
	def set_platform(self,value):
		self.platforms = value
	def add_example(self,desc,code):
		self.examples.append({'description':desc,'code':code})
	def add_parameter(self,name,typestr,desc):
		self.parameters.append({'name':name,'type':typestr,'description':desc})
	def shallow_copy(self):
		shallow_copy = copy.copy(self)
		shallow_copy.methods = []
		shallow_copy.properties = []
		shallow_copy.examples = []
		return shallow_copy
	def __cmp__(self, other):
			if type(other) != type(self):
				return 1
			# Submodule first
			if self.typestr == "module" and other.typestr != "module":
				return 1
			if other.typestr == "module" and self.typestr != "module":
				return -11
			else:
				return cmp(self.name, other.name)

	def to_json(self):
		return {
			'name' : self.name,
			'namespace': self.namespace,
			'methods' : [x.shallow_copy() for x in self.methods],
			'properties' : [x.shallow_copy() for x in self.properties],
			'events' : self.events,
			'examples' : self.examples,
			'platforms' : self.platforms,
			'description' : self.description,
			'type' : self.typestr,
			'returns' : self.returns,
			'since' : self.since,
			'deprecated' : self.deprecated,
			'parameters' : self.parameters,
			'notes' : self.notes
		}

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
	
def tickerize(line):
	idx = line.find('`')
	if idx == -1:
		return line
	idx2 = line.find('`',idx+1)
	return tickerize(line[0:idx] + "<tt>%s</tt>" % line[idx+1:idx2] + line[idx2+1:])
		
def paragraphize(line):
	content = ''
	in_break = False
	in_code = False
	for p in line.strip().split('\n'):
		if p == '' : continue
		if p[0:6] == '<code>' or p[0:7] == '<script':
			content += p
			in_code = True
			continue
		elif p[0:7]=='</code>' or p[0:8] == '</script':
			content += p
			in_code = False
			continue
		if in_code:
			content+= p + '\n'
			continue
		last = p[-1]
		if last == '\\':
			if not in_break: content+='<p>'
			content+=p[0:len(p)-1]
			in_break = True
			continue
		if in_break: 
			content+=p
		else:
			content += '<p>%s' % p
		in_break = False
	if not in_code: content+='</p>'	
	return tickerize(content)

def wrap_code_block(line):
	idx = line.find('<code>')
	if idx == -1: return line
	endx = line.find('</code>',idx)
	desc = line[0:idx].strip()
	code = line[idx+6:endx]
	newcode = """
<script type="syntaxhighlighter" class="brush: js"><![CDATA[%s]]></script>
"""	% code
	after = line[endx+7:]
	return wrap_code_block(paragraphize(desc) + newcode + paragraphize(after))

def emit_events(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_event(tokens[0],tokens[1])

def get_api(namespace):
	global apis
	if not namespace:
		return None
	if not namespace in apis:
		apis[namespace] = API(namespace)
	return apis[namespace]

def emit_namespace(line):
	global current_api
	current_api = get_api(line.strip())

def emit_description(line):
	current_api.set_description(paragraphize(line))

def emit_example(line):
	idx = line.find('<code>')
	endx = line.find('</code>',idx)
	desc = line[0:idx].strip()
	code = line[idx+6:endx].strip()
	current_api.add_example(paragraphize(desc),code)
		
def emit_type(line):
	current_api.set_type(line.strip())

def emit_returns(line):
	current_api.set_returns(line.strip())
			
def emit_since(line):
	current_api.set_since(line.strip())

def emit_platforms(line):
	for token in line.strip().split(","):
		current_api.add_platform(token.strip())

def emit_notes(line):
	current_api.set_notes(wrap_code_block(line))
			
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
	elif state == 'notes':
		emit_notes(line)
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
	

def build_api_from_filesystem():
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

def produce_json(config):
	def json_encoder(obj):
		if hasattr(obj, 'to_json'):
			return obj.to_json()
		raise TypeError(repr(o) + " is not JSON serializable")

	print json.dumps(apis,sort_keys=True,indent=4,default=json_encoder)

def load_template(type):
	template = os.path.join(template_dir,'templates','%s.html' % type)
	if not os.path.exists(template):
		print "Couldn't find template %s" % template
		sys.exit(1)
	return open(template).read()
	
def produce_devhtml_output(config,templates,outdir,theobj):
	for name in theobj:
		obj = theobj[name]
		typestr = obj.typestr
		template = None
		if templates.has_key(typestr):
			template = templates[typestr]
		else:
			template = load_template(typestr)
			templates[typestr] = template

		try:
			output = Template(template).render(config=config,apis=apis,data=obj)
		except:
			print exceptions.html_error_template().render()
			continue

		filename = os.path.join(outdir,'%s.html' % name)
		f = open(filename,'w+')
		f.write(output)
		f.close()

		if obj.typestr == 'module':
			toc_filename = os.path.join(outdir,'toc_%s.json' % name)
			f = open(toc_filename,'w+')
			methods = []
			properties = []
			for m in obj.methods:
				methods.append(m.name)
			for m in obj.properties:
				properties.append(m.name)
			methods.sort()
			properties.sort()
			f.write(json.dumps({'methods':methods,'properties':properties},indent=4))
			f.close()
	
def produce_devhtml(config):
	
	if not config.has_key('output'):
		print "Required command line argument 'output' not provided"
		sys.exit(1)
	
	templates = {}
	outdir = os.path.expanduser(config['output'])
	produce_devhtml_output(config,templates,outdir,apis)

	ns = []
	for key in apis.keys():
		if apis[key].typestr == 'module':
			ns.append(key)
	ns.sort()
	toc = open(os.path.join(outdir,'toc.json'),'w+')
	toc.write(json.dumps(ns,indent=4))
	toc.close()	
	
def main(args):
	if len(args) == 1:
		print "Usage: %s <format>" % os.path.basename(args[0])
		sys.exit(1)
	format = args[1]
	other_args = {}
	c = 2
	while c < len(args):
		kv = args[c].split("=")
		if len(kv) > 1:
			other_args[kv[0].strip()]=kv[1].strip()
		else:
			other_args[kv[0].strip()]=True
		c+=1

	if format != 'json' and format != 'devhtml':
		print "Uh.... I don't understand that format: %s" % format
		sys.exit(1)

	build_api_from_filesystem()
	if format == 'json':
		produce_json(other_args)
	elif format == 'devhtml':
		produce_devhtml(other_args)

	sys.exit(0)

if __name__ == "__main__":
#	main(sys.argv)
	main([sys.argv[0],'devhtml','output=~/Sites/application/apidoc/mobile/0.9/'])
