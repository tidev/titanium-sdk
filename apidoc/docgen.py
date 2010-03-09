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

try:
	from mako.template import Template
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
state_states = {}
buffer = ''

apis = {}
current_api = None

def namesort(a,b):
	return cmp(a['name'],b['name'])

def apisort(a,b):
	return cmp(a.namespace,b.namespace)

htmlr = re.compile(r'<.*?>')
def remove_html_tags(data):
    return htmlr.sub('', data)

class API(object):
	def __init__(self,name):
		self.namespace = name
		self.description = None
		self.typestr = None
		self.subtype = None
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
		self.objects = []
	
	def build_search_index(self):
		index = []
		index.append(obj.namespace)	
		index.append(" ".join(obj.namespace.split('.')))
		index.append(obj.description)
		for o in self.events:
			index.append(o['name'])
		for o in self.methods:
			index.append(o['name'])
		for o in self.properties:
			index.append(o['name'])
		for o in self.examples:
			index.append(o['description'])
		return remove_html_tags(" ".join(index))	
	def add_object(self,obj):
		self.objects.append(obj)
		self.objects.sort(apisort)
	def set_description(self,desc):
		self.description = desc
	def set_since(self,since):
		self.since = since
	def set_deprecated(self,version,note):
		self.deprecated = {'version':version,'reason':note}
	def add_common_proxy_methods(self):
		# these are common module methods
		self.add_method('fireEvent','fire a synthesized event to the views listener')
		self.add_method('addEventListener','add an event listener for the instance to receive view triggered events')
		self.add_method('removeEventListener','remove a previously added event listener')
		self.add_method_property('fireEvent','name','string','name of the event')
		self.add_method_property('fireEvent','event','object','event object')
		self.add_method_property('addEventListener','name','string','name of the event')
		self.add_method_property('addEventListener','callback','function','callback function to invoke when the event is fired')
		self.add_method_property('removeEventListener','name','string','name of the event')
		self.add_method_property('removeEventListener','callback','function','callback function passed in addEventListener')
		
	def set_type(self,typestr):
		self.typestr = typestr
		if self.typestr == 'module':
			self.add_common_proxy_methods()
			
	def set_subtype(self,typestr):
		self.subtype = typestr
		if self.subtype == 'view' or self.subtype == 'proxy':
			self.add_common_proxy_methods()
		if self.subtype == 'view':
			# these are common properties that all views inherit
			self.add_property('backgroundColor','string','the background color of the view')
			self.add_property('borderColor','string','the border color of the view')
			self.add_property('borderWidth','float','the border width of the view')
			self.add_property('borderRadius','float','the border radius of the view')
			self.add_property('backgroundImage','string','the background image url of the view')
			self.add_property('zIndex','int','the z index position relative to other sibling views')
			self.add_property('opacity','float','the opacity from 0.0-1.0')
			self.add_property('anchorPoint','object','a dictionary with properties x and y to indicate the anchor point value. anchor specifies the position by which animation should occur. center is 0.5, 0.5')
			self.add_property('transform','object','the transformation matrix to apply to the view')
			self.add_property('center','object','a dictionary with properties x and y to indicate the center of the views position relative to the parent view')
			self.add_property('visible','boolean','a boolean of the visibility of the view')
			self.add_property('touchEnabled','boolean','a boolean indicating if the view should receive touch events (true, default) or forward them to peers (false)')
			self.add_property('size','object','the size of the view as a dictionary of width and height properties')
			# these are common methods
			self.add_method('add','add a child to the view hierarchy')
			self.add_method_property('add','view','object','the view to add to this views hiearchy')
			self.add_method('remove','remove a previously add view from the view hiearchy')
			self.add_method_property('remove','view','object','the view to remove from this views hiearchy')
			self.add_method('show','make the view visible')
			self.add_method('hide','hide the view')
			self.add_method('animate','animate the view')
			self.add_method_property('animate','obj','object','either a dictionary of animation properties or an Animation object')
			self.add_method_property('animate','callback','function','function to be invoked upon completion of the animation')
			self.add_method('toImage','return a Blob image of the rendered view','object')
			self.add_method_property('toImage','f','function','function to be invoked upon completion. if non-null, this method will be performed asynchronously. if null, it will be performed immediately')
			# these are common events
			self.add_event('swipe','fired when the device detects a swipe (left or right) against the view')
			self.add_event('singletap','fired when the device detects a single tap against the view')
			self.add_event('doubletap','fired when the device detects a double tap against the view')
			self.add_event('twofingertap','fired when the device detects a two-finger tap against the view')
			self.add_event('click','fired when the device detects a click (longer than touch) against the view')
			self.add_event('dblclick','fired when the device detects a double click against the view')
			self.add_event('touchstart','fired as soon as the device detects a gesture')
			self.add_event('touchmove','fired as soon as the device detects a movement of a touch')
			self.add_event('touchcancel','fired when a touch event is interrupted by the device. this happens in circumenstances such as an incoming call to allow the UI to clean up state.')
			self.add_event('touchend','fired when a touch event is completed')
			# common event properties
			self.add_event_property('swipe','direction','direction of the swipe - either left or right');
			for x in self.events:
				self.add_event_property(x['name'],'x','the x point of the event')
				self.add_event_property(x['name'],'y','the y point of the event')
			
	def set_returns(self,returns):
		self.returns = returns
	def set_notes(self,notes):
		self.notes = notes
	def add_method(self,key,value,returntype='void'):
		self.methods.append({'name':key,'value':value,'parameters':[],'returntype':returntype})
		self.methods.sort(namesort)
	def set_method_returntype(self,key,value):
		for m in self.methods:
			if m['name']==key:
				m['returntype']=value
				return
	def add_property(self,key,typev,value):
		for prop in self.properties:
			if prop['name']==key:
				prop['type']=typev
				prop['value']=value
				return
		self.properties.append({'name':key,'type':typev,'value':value})
		self.properties.sort(namesort)
	def add_event(self,key,value):
		props = {}
		props['type'] = 'the name of the event fired'
		props['source'] = 'the source object that fired the event'
		self.events.append({'name':key,'value':value,'properties':props})
		self.events.sort(namesort)
	def add_event_property(self,event,key,value):
		for e in self.events:
			if e['name'] == event:
				e['properties'][key]=value
				return
	def add_method_property(self,name,fn,type,desc):
		for e in self.methods:
			if e['name'] == name:
				e['parameters'].append({'name':fn,'type':type,'description':desc})
	def add_platform(self,value):
		self.platforms.append(value)
	def add_example(self,desc,code):
		self.examples.append({'description':desc,'code':code})
	def add_parameter(self,name,typestr,desc):
		self.parameters.append({'name':name,'type':typestr,'description':desc})
		self.parameters.sort(namesort)
	def to_json(self):
		subs = []
		for s in self.objects:
			subs.append(s.namespace)
		result = {
			'methods' : self.methods,
			'properties' : self.properties,
			'events' : self.events,
			'examples' : self.examples,
			'platforms' : self.platforms,
			'description' : self.description,
			'type' : self.typestr,
			'subtype' : self.subtype,
			'returns' : self.returns,
			'since' : self.since,
			'deprecated' : self.deprecated,
			'parameters' : self.parameters,
			'notes' : self.notes,
			'objects' : subs
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
	if idx == -1: return paragraphize(line)
	endx = line.find('</code>',idx)
	desc = line[0:idx].strip()
	code = line[idx+6:endx]
	newcode = """
<script type="syntaxhighlighter" class="brush: js"><![CDATA[%s]]></script>
"""	% code
	after = line[endx+7:]
	return wrap_code_block(paragraphize(desc) + newcode + paragraphize(after))

def emit_properties(line):
	for tokens in tokenize_keyvalues(line):
		match = re.search('(.*)\[(.*)\]',tokens[0])
		if match == None:
			print "[ERROR] invalid property line: %s. Must be in the format [name[type]]:[description]" % line
			sys.exit(1)
		current_api.add_property(match.group(1), match.group(2), tokens[1])
	
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
	current_api.set_description(paragraphize(line))

def emit_example(line):
	idx = line.find('<code>')
	endx = line.find('</code>',idx)
	desc = line[0:idx].strip()
	code = line[idx+6:endx].strip()
	current_api.add_example(paragraphize(desc),code)
		
def emit_type(line):
	current_api.set_type(line.strip())
	
def emit_subtype(line):
	current_api.set_subtype(line.strip())

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
						
def emit_method_parameter(state,line):
	idx = state.find(":")
	event = state[idx+1:].strip()
	t = event.split(",")
	returntype = 'void'
	if len(t) > 1:
		event = t[0].strip()
		returntype = t[1].strip()
	current_api.set_method_returntype(event,returntype)
	for tokens in tokenize_keyvalues(line):
		desc = tokens[1]
		match = re.search('(.*)\[(.*)\]',tokens[0])
		if match == None:
			print "[ERROR] invalid method line: %s. Must be in the format [name[type][returntype]]:[description]" % line
			sys.exit(1)
		name = match.group(1)
		thetype = match.group(2)
		current_api.add_method_property(event,name,thetype,desc)
							
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
	elif state == 'subtype':
		emit_subtype(line)
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
	elif state.find('method : ')!=-1:
		emit_method_parameter(state,line)
	else:
		print "Huh? [%s]. current state: %s" % (line,state)
		sys.exit(1)
	state_states[state]=True

def process_unprocessed_state():
	global state
	if state.find('method : ')!=-1:
		# we can have a method with a return type but no args
		# since this is valid - in this case, just process as if we had args
		emit_method_parameter(state,"\n")

def start_marker(line):
	global state, buffer
	if buffer != '':
		pass
	if state!='' and state_states[state]==False:
		process_unprocessed_state()
	state = line[2:].strip()
	state_states[state]=False
	

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
			#print '[%s]' % ln
			if ln=='': continue
			if ln[0:1] == '#':
				continue
			if ln[0:1] == '-':
				emit_buffer(buffer)
				buffer = ''
				start_marker(ln)
			else:
				buffer+='%s' % line
		emit_buffer(buffer)


search_json = []

# gather all the child objects into their parents
for name in apis:
	obj = apis[name]
	if obj.typestr == 'object':
		tokens = name.split('.')
		parent = ''
		c = 0
		t = len(tokens)-1
		while c < t:
			parent+=tokens[c]
			c+=1
			if c < t:
				parent+='.'
		parentobj = apis[parent]
		parentobj.add_object(obj)
	
		
	# simply create a search index of tokens that the webserver will use to do doc searchs against
	search_json.append({
		'filename':obj.namespace,
		'content':obj.build_search_index(),
		'type':obj.typestr
	})

def produce_json(config):
	result = {}
	for key in apis:
		result[key] = apis[key].to_json()
	print json.dumps(result,sort_keys=True,indent=4)
	
def load_template(type):
	template = os.path.join(template_dir,'templates','%s.html' % type)
	if not os.path.exists(template):
		print "Couldn't find template %s" % template
		sys.exit(1)
	return open(template).read()

def generate_template_output(config,templates,outdir,typestr,obj):
	template = None
	if templates.has_key(typestr):
		template = templates[typestr]
	else:
		template = load_template(typestr)
		templates[typestr] = template

	output = Template(template).render(config=config,apis=apis,data=obj)
	return output
	
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
		
		print obj.namespace	
		output = Template(template).render(config=config,apis=apis,data=obj)
		filename = os.path.join(outdir,'%s.html' % name)
		f = open(filename,'w+')
		f.write(output)
		f.close()
		
		if obj.typestr == 'module' or obj.typestr == 'object':
			for me in obj.methods:
				n = obj.namespace + '.' + me['name']
				am = API(n)
				am.description = me['value']
				am.returns = me['returntype']
				am.parameters = me['parameters']
				o = generate_template_output(config,templates,outdir,'method',am)
				mo = os.path.join(outdir,'%s.html'%n)
				out = open(mo,'w+')
				out.write(o)
				out.close()
		
		if obj.typestr == 'module':
			toc_filename = os.path.join(outdir,'toc_%s.json' % name)
			f = open(toc_filename,'w+')
			methods = []
			properties = []
			objects = []
			for m in obj.objects:
				s = m.namespace.split('.')[-1]
				objects.append(s)
			for me in obj.methods:
				methods.append(me['name'])
			for m in obj.properties:
				properties.append(m['name'])
			methods.sort()
			properties.sort()
			objects.sort()
			o = json.dumps({'objects':objects,'methods':methods,'properties':properties},indent=4)
			f.write(o)
			f.close()
			
			
	
def produce_devhtml(config):
	
	if not config.has_key('output'):
		print "Required command line argument 'output' not provided"
		sys.exit(1)
	
	templates = {}
	outdir = os.path.expanduser(config['output'])
	if not os.path.exists(outdir):
		os.makedirs(outdir)
		
	produce_devhtml_output(config,templates,outdir,apis)

	ns = []
	for key in apis.keys():
		if apis[key].typestr == 'module':
			ns.append(key)
	ns.sort()
	toc = open(os.path.join(outdir,'toc.json'),'w+')
	toc.write(json.dumps(ns,indent=4))
	toc.close()	
	
	out = open(os.path.join(outdir,'search.json'),'w+')
	out.write(json.dumps(search_json,indent=4))
	out.close()
	
	
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
		
	if format == 'json':
		produce_json(other_args)
	elif format == 'devhtml':
		produce_devhtml(other_args)
	else:
		print "Uh.... I don't understand that format: %s" % format
		sys.exit(1)
	sys.exit(0)
						  
if __name__ == "__main__":
#	main(sys.argv)
#	main([sys.argv[0],'json','output=~/tmp/doc'])	
#	main([sys.argv[0],'devhtml','output=~/work/appcelerator_network/new/public/devcenter/application/apidoc/mobile/1.0.0'])
	main([sys.argv[0],'devhtml','output=~/work/appcelerator_network/new/public/devcenter/application/apidoc/mobile/1.0'])
	
