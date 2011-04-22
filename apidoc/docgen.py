#!/usr/bin/env python
#
# Copyright (c) 2010-2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.
# 
import os, sys
# We package the python markdown module already in the sdk source tree,
# namely in /support/module/support/markdown.  So go ahead and  use it
# rather than rely on it being easy_installed.
this_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_support_dir = os.path.abspath(os.path.join(this_dir, '..', 'support', 'module', 'support'))
if os.path.exists(module_support_dir):
	sys.path.append(module_support_dir)

# We package simplejson under site_scons, so go ahead and add it to sys.path
# in case this is running in Python < 2.6, in which case standard python json
# module is not available
sitescons_dir = os.path.abspath(os.path.join(this_dir, '..', 'site_scons'))
if os.path.exists(sitescons_dir):
	sys.path.append(sitescons_dir)

try:
	import json
except:
	import simplejson as json

import re, optparse, string
from os.path import join, splitext, split, exists
from htmlentitydefs import name2codepoint 

def err(s):
	print >> sys.stderr, s

def rpartition(s, delim):
	if not delim in s:
		return ('', '', s)
	i = s.rfind(delim)
	if i == 0:
		if len(s) == 1:
			return ('', delim, '')
		return ('', delim, s[i+1:])
	return (s[:i], delim, s[i+1:])

use_ordered_dict = False
try:
	from collections import OrderedDict
	use_ordered_dict = True
except:
	try:
		from odict import odict as OrderedDict
		use_ordered_dict = True
	except:
		pass

try:
	import markdown
except:
	err("You don't have markdown!\n")
	err("You can install it with:\n")
	err(">  easy_install ElementTree\n")
	err(">  easy_install Markdown\n")
	err("")
	sys.exit(1)

try:
	from mako.template import Template
	from mako.lookup import TemplateLookup
except:
	Template = None
	TemplateLookup = None
try:
	from pygments import highlight
	from pygments.formatters import HtmlFormatter
	from pygments.lexers import get_lexer_by_name
except:
	highlight = None
	HtmlFormatter = None
	get_lexer_by_name = None

def template_dependencies():
	if not Template or not TemplateLookup:
		err("You don't have mako!\n")
		err("You can install it with:\n")
		err(">  easy_install Mako")
		err("")
		sys.exit(1)
	if not highlight or not HtmlFormatter or not get_lexer_by_name:
		err("You don't have Pygments!\n")
		err("You can install it with:\n")
		err(">  easy_install Pygments")
		err("")
		sys.exit(1)
	
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

ignoreFiles = ['.gitignore', '.cvsignore'];
ignoreDirs = ['.git','.svn', 'CVS'];

state = ''
state_states = {}
buffer = ''
current_file = None
current_line = -1

apis = {}
current_api = None

stats = {
	'modules':0,
	'objects':0,
	'properties':0,
	'methods':0
}

default_language = "javascript"

def to_ordered_dict(orig_dict, key_order):
	if not use_ordered_dict:
		return orig_dict
	already_added = []
	odict = OrderedDict()
	for key in key_order:
		if key in orig_dict:
			odict[key] = orig_dict[key]
			already_added.append(key)

	# Possible that not all keys were provided, so go thru orig
	# dict and make sure all elements get in new, ordered dict
	for key in orig_dict:
		if not key in already_added:
			odict[key] = orig_dict[key]
	return odict

def strip_tags(value):
	return re.sub(r'<[^>]*?>', '', value)

def namesort(a,b):
	return cmp(a['name'],b['name'])

def map_properties(srcobj, destobj, srcprops, destprops):
	for i in range(len(srcprops)):
		srcprop = srcprops[i]
		destprop = destprops[i]
		destobj[destprop] = srcobj[srcprop]
	return destobj

def resolve_supported_platforms(parent_platforms, object_specs):
	platforms = [x.lower() for x in parent_platforms]
	for p in parent_platforms:
		if '-'+p.lower() in object_specs and p.lower() in platforms:
			platforms.remove(p.lower())
	return platforms

def clean_type(the_type):
	type_out = the_type.replace('`', '')
	type_out = type_out.replace('|', ',') # settle on one of two of the valid type separators
	type_out = ','.join( [s.strip() for s in type_out.split(',') if len(s)] )
	m = re.search(r'(href.*>|tt>)+(.*)\<', type_out)
	if m and len(m.groups()) == 2:
		type_out = m.groups()[1]
	type_out = type_out[0].upper() + type_out[1:]
#	type_out = string.capwords(type_out, '.')
	type_out = '<'.join( [ s[0].upper() + s[1:] for s in type_out.split('<') if len(s) ])
	type_out = ','.join( [ s[0].upper() + s[1:] for s in type_out.split(',') if len(s) ])
	if ',' in type_out:
		type_out = ','.join( [ clean_type(s) for s in type_out.split(',') if len(s) ] )
	if '.' in type_out:
		type_out = '.'.join( [ clean_type(s) for s in type_out.split('.') if len(s) ] )
	if type_out.lower() in ['int','integer','float','double','long']:
		type_out = 'Number'
	if type_out.lower() == 'bool':
		type_out = 'Boolean'
	if type_out.lower() == 'domnode': # special case
		type_out = 'DOMNode'
	if type_out[0].isdigit():
		type_out = '_' + type_out # this handles 2DMatrix and 3DMatrix, which are invalid JS names
	return type_out

def clean_namespace(ns_in):
	def clean_part(part):
		if len(part) and part[0].isdigit():
			return '_' + part
		else:
			return part
	return '.'.join( [ clean_part(s) for s in ns_in.split('.') ])

def to_jsca_example(example):
	return map_properties(example, {}, ('description', 'code'), ('name', 'code'))

def to_jsca_property(prop):
	result = map_properties(prop, {}, ('name', 'type_jsca', 'value', 'isClassProperty'), ('name', 'type', 'description', 'isClassProperty'))
	if result['type']:
		result['type'] = clean_type(result['type'])
	result['isInstanceProperty'] = not result['isClassProperty']
	result['since'] = [ { 'name': 'Titanium Mobile SDK', 'version' : prop['since'] } ]
	result['userAgents'] = [ { 'platform' : x } for x in prop['platforms'] ]
	result['isInternal'] = False # we don't make this distinction (yet anyway)
	result['examples'] = [] # we don't have examples at the property level (yet anyway)
	return to_ordered_dict(result, ('name',)) 

def to_jsca_param(param):
	result = map_properties(param, {}, ('name', 'description'), ('name', 'description'))
	if param['type']:
		result['type'] = clean_type(param['type'])
	# we don't have data for this yet in our tdocs:
	result['usage'] = ''
	return to_ordered_dict(result, ('name',))

def to_jsca_function(method):
	result = map_properties(method, {}, ('name', 'value'), ('name', 'description'))
	if method['returntype'] and method['returntype'].lower() != 'void':
		result['returnTypes'] = [ { 'type': clean_type(method['returntype']), 'description' : '' }]
	if method['parameters']:
		result['parameters'] = [to_jsca_param(x) for x in method['parameters']]
	result['since'] = [ { 'name': 'Titanium Mobile SDK', 'version' : method['since'] } ]
	result['userAgents'] = [ { 'platform' : x } for x in method['platforms'] ]
	result['isInstanceProperty'] = True # we don't have class static methods
	result['isClassProperty'] = False # we don't have class static methods
	result['isInternal'] = False # we don't make this distinction (yet anyway)
	result['examples'] = [] # we don't have examples at the method level (yet anyway)
	result['references'] = [] # we don't use the notion of 'references' (yet anyway)
	result['exceptions'] = [] # we don't specify exceptions (yet anyway)
	result['isConstructor'] = False # we don't expose native class constructors
	result['isMethod'] = True # all of our functions are class instance functions, ergo methods
	return to_ordered_dict(result, ('name',))

def to_jsca_event(event):
	result = map_properties(event, {}, ('name', 'value'), ('name', 'description'))
	result['properties'] = []
	if event['properties']:
		for key in event['properties']:
			result['properties'].append( { 'name': key, 'description': event['properties'][key] } )
	return to_ordered_dict(result, ('name',))

def apisort(a,b):
	return cmp(a.namespace,b.namespace)

htmlr = re.compile(r'<.*?>')
def remove_html_tags(data):
    return htmlr.sub('', data)

class API(object):
	def remove_html_tags(self,str):
		return remove_html_tags(str)
	def vsdoc_return_type(self, str):
		retTypes = {
			'bool' : 'true',
			'boolean' : 'true',
			'void' : '',
			'string' : "''",
			'double' : '0.0',
			'int' : '0',
			'array' : '[]',
			'object' : '{}',
			'function' : 'function(){}',
			'float' : '0.0',
			'float,string' : "''",
			'int,string' : "''",
			'string,int' : "''",
			'date' : 'new Date()',
			'long' : '0',
			'callback' : 'function(){}',
			'Intent' : 'Titanium.Android.Intent',
			'Titanium.App.Android.R':"function(){return Titanium.App.Android.R;}"
		}
		return retTypes.get(str,str)
	
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
		self.parent_namespace = ".".join(self.namespace.split('.')[0:-1])
	
	def build_search_index(self):
		index = []
		index.append(self.namespace)	
		index.append(" ".join(self.namespace.split('.')))
		index.append(self.description)
		for o in self.events:
			index.append(o['name'])
		for o in self.methods:
			index.append(o['name'])
		for o in self.properties:
			index.append(o['name'])
		for o in self.examples:
			index.append(strip_tags(o['description']))
		if self.notes!=None:
			index.append(strip_tags(self.notes))
		return remove_html_tags(" ".join(index))	
	def add_object(self,obj):
		if obj.typestr!='proxy': 
			tokens = obj.namespace.split(".")
			m = 'create%s' % tokens[len(tokens)-1]
			tokens[len(tokens)-1] = m
			link = '<a href="%s.html">%s</a>'%(obj.namespace,obj.namespace)
			self.add_method(m,'create and return an instance of %s' %link,'object')
			self.add_method_property(m,'parameters','object','(optional) a dictionary object properties defined in %s'%link)
		if obj.typestr == 'proxy':
			obj.typestr = 'object'
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
		
	def add_common_viewproxy_stuff(self):
		# these are common properties that all views inherit
		self.add_property('backgroundColor','string','the background color of the view')
		self.add_property('backgroundSelectedColor', 'string', 'the selected background color of the view. focusable must be true for normal views. (Android)')
		self.add_property('backgroundFocusedColor', 'string', 'the focused background color of the view. focusable must be true for normal views. (Android)')
		self.add_property('backgroundDisabledColor', 'string', 'the disabled background color of the view. (Android)')
		self.add_property('backgroundGradient','object','a background gradient for the view with the properties: type,startPoint,endPoint,startRadius,endRadius,backfillStart,backfillEnd,colors.')
		self.add_property('backgroundLeftCap','float','End caps specify the portion of an image that should not be resized when an image is stretched. This technique is used to implement buttons and other resizable image-based interface elements. When a button with end caps is resized, the resizing occurs only in the middle of the button, in the region between the end caps. The end caps themselves keep their original size and appearance. This property specifies the size of the left end cap. The middle (stretchable) portion is assumed to be 1 pixel wide. The right end cap is therefore computed by adding the size of the left end cap and the middle portion together and then subtracting that value from the width of the image')
		self.add_property('backgroundTopCap','float','End caps specify the portion of an image that should not be resized when an image is stretched. This technique is used to implement buttons and other resizable image-based interface elements. When a button with end caps is resized, the resizing occurs only in the middle of the button, in the region between the end caps. The end caps themselves keep their original size and appearance. This property specifies the size of the top end cap. The middle (stretchable) portion is assumed to be 1 pixel wide. The bottom end cap is therefore computed by adding the size of the top end cap and the middle portion together and then subtracting that value from the height of the image')
		self.add_property('animatedCenterPoint','object','read-only object with x and y properties of where the view is during animation')
		self.add_property('borderColor','string','the border color of the view')
		self.add_property('borderWidth','float','the border width of the view')
		self.add_property('borderRadius','float','the border radius of the view')
		self.add_property('backgroundImage','string','the background image url of the view')
		self.add_property('backgroundSelectedImage', 'string', 'the selected background image url of the view. focusable must be true for normal views. (Android)')
		self.add_property('backgroundFocusedImage', 'string', 'the focused background image url of the view. focusable must be true for normal views. (Android)')
		self.add_property('backgroundDisabledImage', 'string', 'the disabled background image url of the view. (Android)')
		self.add_property('zIndex','int','the z index position relative to other sibling views')
		self.add_property('opacity','float','the opacity from 0.0-1.0')
		self.add_property('anchorPoint','object','a dictionary with properties x and y to indicate the anchor point value. anchor specifies the position by which animation should occur. center is 0.5, 0.5')
		self.add_property('transform','object','the transformation matrix to apply to the view')
		self.add_property('center','object','a dictionary with properties x and y to indicate the center of the views position relative to the parent view')
		self.add_property('visible','boolean','a boolean of the visibility of the view')
		self.add_property('touchEnabled','boolean','a boolean indicating if the view should receive touch events (true, default) or forward them to peers (false)')
		self.add_property('size','object','the size of the view as a dictionary of width and height properties')
		self.add_property('width','float,string','property for the view width. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('height','float,string','property for the view height. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('top','float,string','property for the view top position. This position is relative to the view\'s parent. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('left','float,string','property for the view left position. This position is relative to the view\'s parent. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('right','float,string','property for the view right position. This position is relative to the view\'s parent. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('bottom','float,string','property for the view bottom position. This position is relative to the view\'s parent. Can be either a float value or a dimension string ie \'auto\' (default).')
		self.add_property('softKeyboardOnFocus',['int', '-iphone','-ipad'],'One of Titanium.UI.Android.SOFT_KEYBOARD_DEFAULT_ON_FOCUS, Titanium.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS, or Titanium.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS. (Android only)')
		self.add_property('focusable',['boolean', '-iphone','-ipad'],'Set true if you want a view to be focusable when navigating with the trackball or D-Pad. Default: false. (Android Only)')
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
		self.add_event('touchmove','fired as soon as the device detects movement of a touch.  Event coordinates are always relative to the view in which the initial touch occurred')
		self.add_event('touchcancel','fired when a touch event is interrupted by the device. this happens in circumenstances such as an incoming call to allow the UI to clean up state.')
		self.add_event('touchend','fired when a touch event is completed')
		# font specials
		self.add_property('font-weight','string','the font weight, either normal or bold')
		self.add_property('font-size','string','the font size')
		self.add_property('font-style','string','the font style, either normal or italics')
		self.add_property('font-family','string','the font family')
		# common event properties
		self.add_event_property('swipe','direction','direction of the swipe - either left or right');
		for x in self.events:
			self.add_event_property(x['name'],'x','the x point of the event in receiving view coordiantes')
			self.add_event_property(x['name'],'y','the y point of the event, in receiving view coordinates')
			self.add_event_property(x['name'],'globalPoint','a dictionary with properties x and y describing the point of the event in screen coordinates')
	def set_type(self,typestr):
		self.typestr = typestr
	
	def set_subtype(self,typestr):
		self.subtype = typestr

	def set_returns(self,returns):
		self.returns = returns
	def set_notes(self,notes):
		self.notes = notes
	def add_method(self,key,value,returntype='void'):
		found = False
		for e in self.methods:
			if e['name'] == key:
				found = True
				e['value']=value
				e['returntype']=returntype
				e['since']=self.since
				break
		if found==False:
			self.methods.append({
				'name':key,
				'value':value,
				'parameters':[],
				'returntype':returntype,
				'since':self.since,
				'platforms':self.platforms,
				'filename':make_filename('method',self.namespace,key)})
		self.methods.sort(namesort)
	def set_method_returntype(self,key,value):
		tokens = value.split(';')
		the_type = tickerize(tokens[0])
		for m in self.methods:
			if m['name']==key:
				m['returntype'] = the_type
				m['deprecated'] = 'deprecated' in tokens
				m['platforms'] = resolve_supported_platforms(self.platforms, tokens)
				return
	def add_property(self,key,orig_specs,value):
		specs = orig_specs
		if isinstance(specs, basestring):
			specs = [ specs ]
		if len(specs) == 0:
			# We need at least type, which should be the first member of specs
			# Default to object
			specs = [ 'object' ]
		the_type = specs[0]

		# in case someone put a spec in with case
		specs = [x.lower() for x in orig_specs]
		# specs example: [int;classproperty;deprecated].  The type is always specs[0]
		if 'classproperty' in specs:
			classprop = True
		else:
			classprop = (key.upper() == key) # assume all upper case props are class constants
		deprecated = 'deprecated' in specs
		platforms = resolve_supported_platforms(self.platforms, specs)
		if len(platforms): # if not valid for any platform, don't add it.
			for prop in self.properties:
				if prop['name']==key:
					prop['type']=tickerize(the_type)
					prop['type_jsca'] = the_type
					prop['value']=value
					prop['isClassProperty']=classprop
					prop['deprecated'] = deprecated
					prop['platforms'] = resolve_supported_platforms(self.platforms, specs)
					prop['since'] = self.since
					return
			self.properties.append({
				'name':key,
				'type':tickerize(the_type),
				'type_jsca':the_type,
				'value':value,
				'isClassProperty':classprop,
				'deprecated':deprecated,
				'platforms':resolve_supported_platforms(self.platforms, specs),
				'since':self.since,
				'filename':make_filename('property',self.namespace,key)
				})
			self.properties.sort(namesort)
	def add_event(self,key,value):
		props = {}
		props['type'] = 'the name of the event fired'
		props['source'] = 'the source object that fired the event'
		found = False
		for e in self.events:
			if e['name']==key:
				e['value']=value
				found = True
				break
		if found==False:			
			self.events.append({'name':key,'value':value,'properties':props,'filename':make_filename('event',self.namespace,key)})
		self.events.sort(namesort)
	def add_event_property(self,event,key,value, orig_spec=None):
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
	def to_jsca(self):
		jsca_deprecated = False
		if self.deprecated:
			jsca_deprecated = True
		jsca_examples = []
		if self.examples:
			jsca_examples = [to_jsca_example(x) for x in self.examples]
		jsca_properties = []
		if self.properties:
			jsca_properties = [to_jsca_property(x) for x in self.properties if not x['name'].startswith('font-')]
		jsca_functions = []
		if self.methods:
			jsca_functions = [to_jsca_function(x) for x in self.methods]
		jsca_events = []
		if self.events:
			jsca_events = [to_jsca_event(x) for x in self.events]
		jsca_remarks = []
		if self.notes:
			jsca_remarks = [ self.notes ]
		result = {
				'name': clean_namespace(self.namespace),
				'description': self.description,
				'deprecated' : jsca_deprecated,
				'examples' : jsca_examples,
				'properties' : jsca_properties,
				'functions' : jsca_functions,
				'events' : jsca_events,
				'remarks' : jsca_remarks,
				'userAgents' : [ { 'platform' : x } for x in self.platforms ],
				'since' : [ { 'name': 'Titanium Mobile SDK', 'version' : self.since } ]
				}
		return to_ordered_dict(result, ('name',))
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
	def get_filename(self):
		return make_filename(self.typestr, self.namespace)
	def get_parent_filename(self):
		if self.parent_namespace in apis:
			return apis[self.parent_namespace].get_filename()
	def finish_api_definition(self):
		if self.typestr == 'module' or self.subtype == 'view' or self.subtype == 'proxy':
			self.add_common_proxy_methods()
		if self.subtype == 'view':
			self.add_common_viewproxy_stuff()

def make_filename(objtype, namespace, name=None):
	fullname = name and '.'.join([namespace,name]) or namespace
	# "proxy" gets forcibly set to "object" at some point, so
	# so don't write out "-proxy" as the filename, else we'll
	# have broken links.
	if objtype == 'proxy':
		return '%s-object' % fullname
	else:
		return '%s-%s' % (fullname, objtype)


def find_filename(namespace):
	if namespace in apis:
		return apis[namespace].get_filename()
	# Try finding the parent
#	(parent, delim, name) = namespace.rpartition('.')
	(parent, delim, name) = rpartition(namespace, '.')
	if parent != '' and parent in apis:
		parent = apis[parent]
		for item in (parent.methods + parent.properties + parent.events):
			if item['name'] == name:
				return item['filename']
	# Guess we failed to find anything interesting
	return namespace

def split_keyvalue(line):
	idx = line.find(": ")
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
	# Prevent infinite loops of doooooooom.
	if idx2 < idx:
		err("Malformed doc file! Missing a second backtick in: %s" % line)
		sys.exit(1)
	token = line[idx+1:idx2]
	if token.startswith("Titanium."):
		content = "<a href=\"%s.html\">%s</a>" % (find_filename(token),token)
	else:
		content = "<tt>%s</tt>" % token
	return tickerize(line[0:idx] + content + line[idx2+1:])

def anchorize(line):
	idx = line.find('[[')
	if idx == -1:
		return line
	idx2 = line.find(']]',idx+2)
	anchor = line[idx+2:idx2] 
	before = line[0:idx-1] + ' '
	after = line[idx2+2:]
	result = before + "<a href=\"%s.html\">%s</a>" % (find_filename(anchor),anchor) + after
	return anchorize(result)
	
def htmlerize(content):
	begin = 0
	end = len(content)
	idx = content.find('\\')
	buf = ''
	while idx > 0:
		buf+=content[begin:idx]
		begin = idx+2
		idx = content.find('\\',begin)
		if idx < 0: break
	if begin < end: buf+=content[begin:]
	return html_unescape(markdown.markdown(anchorize(tickerize(buf)),['extra'],output_format='html4'))
			
def paragraphize(line):
	return htmlerize(line)

def wrap_code_block(line):
	return htmlerize(line)

def replace_entities(match):
    try:
        ent = match.group(1)
        if ent[0] == "#":
            if ent[1] == 'x' or ent[1] == 'X':
                return unichr(int(ent[2:], 16))
            else:
                return unichr(int(ent[1:], 10))
        return unichr(name2codepoint[ent])
    except:
        return match.group()

entity_re = re.compile(r'&(#?[A-Za-z0-9]+?);')
def html_unescape(data):
    return entity_re.sub(replace_entities, data)

def emit_properties(line):
	for tokens in tokenize_keyvalues(line):
		match = re.search('(.*)\[(.*)\]',tokens[0])
		if match == None:
			err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
			err("[ERROR] invalid property line: %s. Must be in the format [name[type]]:[description]" % line)
			sys.exit(1)
		specs = match.group(2).split(';')
		current_api.add_property(match.group(1), specs, htmlerize(tokens[1]))

def emit_methods(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_method(tokens[0],htmlerize(tokens[1]))
	
def emit_events(line):
	for tokens in tokenize_keyvalues(line):
		current_api.add_event(tokens[0],htmlerize(tokens[1]))

def emit_namespace(line):
	global apis, current_api
	line = line.strip()
	current_api = API(line)
	if current_api.namespace in apis:
		err("[WARN] %s info just got replaced.  There's probably a wrong '- namespace' entry either in the current file or another file (duplicate)." % current_api.namespace)
	apis[current_api.namespace] = current_api
	
def emit_description(line):
	current_api.set_description(htmlerize(line))
		
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
		err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
		err("[ERROR] invalid deprecation line: %s. Must be in the format [version]:[description]" % line)
		sys.exit(1)
	current_api.set_deprecated(tickerize(line[0:idx].strip()),htmlerize(line[idx+1:].strip()))
	
def emit_parameters(lines):
	for line in lines.split("\n"):
		line = line.strip()
		if line == '': continue
		idx = line.find(':')
		if idx == -1:
			err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
			err("[ERROR] invalid parameters line: %s. Must be in the format [name[type]]:[description]" % line)
			sys.exit(1)
		key = line[0:idx].strip()
		desc = line[idx+1:].strip()
		match = re.search('(.*)\[(.*)\]',key)
		if match == None:
			err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
			err("[ERROR] invalid parameters line: %s. Must be in the format [name[type]]:[description]" % line)
			sys.exit(1)
		current_api.add_parameter(match.group(1), tickerize(match.group(2)), htmlerize(desc))
					
def emit_event_parameter(state,line):
	idx = state.find(":")
	event = state[idx+1:].strip()
	for tokens in tokenize_keyvalues(line):
		paramname = tokens[0]
		type_info = []
		match = re.search('(.*)\[(.*)\]',tokens[0])
		if match:
			paramname = match.group(1)
			type_info = match.group(2).split(';')
		current_api.add_event_property(event,tickerize(paramname),htmlerize(tokens[1]), orig_spec=type_info)

def emit_example_parameter(state,line):
	idx = state.find(":")
	desc = state[idx+1:].strip()
	current_api.add_example(tickerize(desc),htmlerize(line))
						
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
			err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
			err("[ERROR] invalid method line: %s. Must be in the format [name[type][returntype]]:[description]" % line)
			sys.exit(1)
		name = match.group(1)
		thetype = match.group(2)
		current_api.add_method_property(event,name,tickerize(thetype),tickerize(desc))
	
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
	elif state.find('example : ')!=-1:
		emit_example_parameter(state,line)
	else:
		err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
		err("Huh? [%s]. current state: %s" % (line,state))
		sys.exit(1)
	state_states[state]=True

def process_unprocessed_state():
	global state, buffer
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
	

search_json = []
def process_tdoc():
	for root, dirs, files in os.walk(template_dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			if splitext(file)[-1] != '.tdoc' or file=='template.tdoc':
				continue
			from_ = join(root, file)
			current_file = from_
			err("Processing: %s" % file) # write to stderr to not get into useful, redirected output in json mode
			content = open(from_).readlines()
			buffer = ''
			current_line = 0
			for line in content:
				current_line = current_line + 1
				ln = line.strip()
				if ln[0:1] == '#' and line[1:2] == ' ':
					continue
				if ln[0:1] == '-' and line[1:2] == ' ':
					emit_buffer(buffer)
					buffer = ''
					start_marker(ln)
				else:
					buffer+='%s' % line
			emit_buffer(buffer)
			current_api.finish_api_definition()

	# gather all the child objects into their parents
	for name in apis:
		obj = apis[name]
		if obj.typestr == 'object' or obj.typestr == 'proxy':
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

def clean_links(text):
	link1 = re.compile(r'"([^"]*?)\.html"')
	link2 = re.compile(r"'([^']*?)\.html'")
	repl = lambda match: '"%s.html"' % find_filename(match.group(1))
	return link2.sub(repl, link1.sub(repl, text))

def produce_jsca(config,dump=True):
	result = {'aliases': [ {'name': 'Ti', 'type': 'Titanium'} ]}
	types = []
	result['types'] = types

	def type_exists(type_name):
		for onetype in types:
			if onetype['name'] == type_name:
				return True
		return False

	for key in apis:
		types.append( apis[key].to_jsca() )

	# Cleanup our frequent use of "object" as parameter and return type of the createXXX proxy
	# creation methods.  Set them instead to the proxies themselves as hints.
	for onetype in types:
		if onetype['functions']:
			for onefunc in onetype['functions']:
				match = re.search(r'^create(([A-Z]|[12]).*)$', onefunc['name'])
				if match:
					parent_name = onetype['name']
					type_name = match.group(1)
					full_name = parent_name + '.' + type_name
					if type_exists(full_name):
						if 'parameters' in onefunc and len(onefunc['parameters']) > 0:
							paramType = onefunc['parameters'][0]['type']
							if paramType.lower() == 'object':
								onefunc['parameters'][0]['type'] = full_name
						if 'returnTypes' in onefunc and len(onefunc['returnTypes']) > 0:
							returnType = onefunc['returnTypes'][0]['type']
							if returnType.lower() == 'object':
								onefunc['returnTypes'][0]['type'] = full_name
	if dump:
		print json.dumps(result,sort_keys=False,indent=4)
	else:
		return json.dumps(result,sort_keys=False,indent=4)

def produce_json(config,dump=True):
	result = {}
	for key in apis:
		result[key] = apis[key].to_json()
	if dump:
		print json.dumps(result,sort_keys=True,indent=4)
	else:
		return json.dumps(result,sort_keys=True,indent=4)
	
def load_template(type):
	template = os.path.join(template_dir,'templates','%s.html' % type)
	if not os.path.exists(template):
		err("[ERROR] in file: %s at line: %d" % (current_file, current_line))
		err("Couldn't find template %s" % template)
		sys.exit(1)
	return open(template).read()

def colorize_code(line):
	idx = line.find("<code>")
	if idx == -1:
		return line
	idx2 = line.find("</code>",idx)
	code = line[idx+6:idx2]
	# TODO: we need a way to override the source code language
	# Using guess_lexer doesn't seem to be consistent
	lexer = get_lexer_by_name(default_language)
	formatter = HtmlFormatter()
	result = highlight(code, lexer, formatter)
	before = line[0:idx]
	after = line[idx2+7:]
	content = before + result + after
	return colorize_code(content)
	
def generate_template_output(config,templates,outdir,typestr,obj):
	template = None
	if templates.has_key(typestr):
		template = templates[typestr]
	else:
		template = load_template(typestr)
		templates[typestr] = template

	output = Template(template).render(config=config,apis=apis,data=obj)
	output = clean_links(output)
	if config.has_key('colorize'):
		output = colorize_code(output)
	return output
	
modules_found = {}
def produce_devhtml_output(config,templates,outdir,theobj):
	global stats, modules_found
	for name in theobj:
		obj = theobj[name]
		typestr = obj.typestr
		template = None
		if templates.has_key(typestr):
			template = templates[typestr]
		else:
			template = load_template(typestr)
			templates[typestr] = template
		
		output = Template(template).render(config=config,apis=apis,data=obj)
		output = clean_links(output)
		filename = os.path.join(outdir,'%s.html' % obj.get_filename())
		f = open(filename,'w+')
		if config.has_key('css'):
			f.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\">\n" % config['css'])
		if config.has_key('colorize'):
			f.write(colorize_code(output))
		else:
			f.write(output)
		f.close()
		if obj.typestr == 'module':
			if not modules_found.has_key(obj.namespace):
				stats['modules']+=1
				modules_found[obj.namespace]=True
				err(obj.namespace)
		if obj.typestr == 'object':
			stats['objects']+=1
		
		if obj.typestr == 'module' or obj.typestr == 'object':
			for me in obj.methods:
				n = obj.namespace + '.' + me['name']
				am = API(n)
				am.description = me['value']
				am.returns = me['returntype']
				am.parameters = me['parameters']
				o = generate_template_output(config,templates,outdir,'method',am)
				mo = os.path.join(outdir,'%s.html'%me['filename'])
				out = open(mo,'w+')
				if config.has_key('css'):
					out.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\">\n" % config['css'])
				out.write(o)
				out.close()
				stats['methods']+=1
			for me in obj.properties:
				n = obj.namespace + '.' + me['name']
				am = API(n)
				am.description = me['value']
				am.type = me['type']
				o = generate_template_output(config,templates,outdir,'property',am)
				mo = os.path.join(outdir,'%s.html'%me['filename'])
				out = open(mo,'w+')
				if config.has_key('css'):
					out.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\">\n" % config['css'])
				out.write(o)
				out.close()
				stats['properties']+=1

		
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

			for me in obj.properties:
				n = obj.namespace + '.' + me['name']
				am = API(n)
				am.description = me['value']
				am.type = me['type']
				o = generate_template_output(config,templates,outdir,'property',am)
				mo = os.path.join(outdir,'%s.html'%me['filename'])
				out = open(mo,'w+')
				if config.has_key('css'):
					out.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\">\n" % config['css'])
				out.write(o)
				out.close()
				stats['properties']+=1
			
			
	
def produce_devhtml(config):
	
	if not config.has_key('output'):
		err("Required command line argument 'output' not provided")
		sys.exit(1)
	if not config.has_key('version'):
		err("Required command line argument 'version' not provided")
		sys.exit(1)
			
	version = config['version']
	
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

	out = open(os.path.join(outdir,'stats.json'),'w+')
	out.write(json.dumps(stats,indent=4))
	out.close()
	
	out = open(os.path.join(outdir,'search.json'),'w+')
	out.write(json.dumps(search_json,indent=4))
	out.close()
	
	out = open(os.path.join(outdir,'api.json'),'w+')
	out.write(produce_json(config,False));
	out.close()
	
	out = open(os.path.join(outdir,'api_new.json'),'w+')
	out.write(produce_jsca(config,False));
	out.close()
	
	changelog_mdoc = os.path.join(template_dir,'Titanium','CHANGELOG','%s.mdoc'%version)
	if not exists(changelog_mdoc):
		err('Warning: %s wasn\'t found, skipping changelog.html generation' % changelog_mdoc)
		return
	
	changelog = open(changelog_mdoc).read()
	out = open(os.path.join(outdir,'changelog.html'),'w+')
	out.write(htmlerize(changelog))
	out.close()

def produce_vsdoc(config):
	if not config.has_key('output'):
		err("Required command line argument 'output' not provided")
		sys.exit(1)
			
	outdir = os.path.expanduser(config['output'])
	
	if not os.path.exists(outdir):
		os.makedirs(outdir)
	
	produce_vsdoc_output(config,outdir,apis)
	
def produce_vsdoc_output(config,outdir,theobj):
	lookupDir = TemplateLookup(directories=[os.path.join(template_dir,'templates')])
	
	filename = os.path.join(outdir,'Titanium-vsdoc.js')
	f = open(filename,'w+')
	
	for name in sorted(theobj.iterkeys()):
		obj = theobj[name]
		# objects and modules have everything we need for the vsdoc
		if obj.typestr == 'module' or obj.typestr == 'object':
			output = lookupDir.get_template('module.vsdoc.html').render(config=config,data=obj)
			f.write(output)
	f.close()
	err('vsdoc created: ' + filename)
	
def main():
	parser = optparse.OptionParser()
	parser.add_option('-f', '--format', dest='format', help='Format of output: json, vsdoc or devhtml (default)', default='devhtml')
	parser.add_option('--css', dest='css', help='Path to a custom CSS stylesheet to use in each HTML page', default=None)
	parser.add_option('-o', '--output', dest='output', help='Output directory for generated documentation', default=None)
	parser.add_option('-v', '--version', dest='version', help='Version of the API to generate documentation for', default=None)
	parser.add_option('--colorize', dest='colorize', action='store_true', help='Colorize code in examples', default=False)
	(options, args) = parser.parse_args()
	
	other_args = {}
	
	titanium_dir = os.path.dirname(template_dir)
	dist_apidoc_dir = join(titanium_dir, 'dist', 'apidoc')
	sys.path.append(join(titanium_dir, 'build'))
	import titanium_version
	
	other_args['output'] = options.output or dist_apidoc_dir
	other_args['version'] = options.version or titanium_version.version
	
	if options.css != None:
		other_args['css'] = options.css
	
	if options.colorize:
		other_args['colorize'] = True
	
	"""c = 2
	while c < len(args):
		kv = args[c].split("=")
		if len(kv) > 1:
			other_args[kv[0].strip()]=kv[1].strip()
		else:
			other_args[kv[0].strip()]=True
		c+=1"""
	
	format_handlers = {'json': produce_json, 'devhtml': produce_devhtml, 'vsdoc' : produce_vsdoc, 'jsca' : produce_jsca}
	if options.format in format_handlers:
		if options.format == 'jsca' and not use_ordered_dict:
			err("You don't have an ordered dictionary module which you need for the jsca format!\n")
			err("But you can get one easily via easy_install:\n")
			err(">  easy_install odict")
			err("")
			sys.exit(1)
		if options.format != 'jsca':
			template_dependencies()
		err('Generating Documentation for Titanium version %s to %s...' % (other_args['version'], other_args['output']))
		process_tdoc()
		format_handlers[options.format](other_args)
	else:
		err("Uh.... I don't understand that format: %s" % options.format)
		sys.exit(1)
	sys.exit(0)

if __name__ == "__main__":
	main()
#	main(sys.argv)
#	main([sys.argv[0],'json','output=~/tmp/doc'])	
#	main([sys.argv[0],'devhtml','output=~/work/appcelerator_network/new/public/devcenter/application/apidoc/mobile/1.0.0'])
#	main([sys.argv[0],'devhtml','version=1.4','output=~/work/appcelerator_network/new/public/devcenter/application/apidoc/mobile/1.4'])
#	main([sys.argv[0],'devhtml','colorize','css=page.css','output=~/work/titanium_mobile/demos/KitchenSink_iPad/Resources/apidoc'])
	
