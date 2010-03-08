#!/usr/bin/env python
#
# Copyright (c) 2010 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.

import copy
import json
import os
import re
import sys
import os.path as path
from optparse import OptionParser

try:
	from mako.template import Template
	from mako import exceptions
except:
	print "Crap, you don't have mako!\n"
	print "Easy install that bitch:\n"
	print ">  easy_install Mako"
	sys.exit(1)

try:
	import yaml
except:
	print "Crap, you don't have yaml!\n"
	print "Easy install that bitch:\n"
	print ">  easy_install PyYaml"
	sys.exit(1)


class API(object):
	apis = {}
	templates = {}

	@classmethod
	def get_api(cls, namespace):
		if not namespace in cls.apis:
			cls.apis[namespace] = API(namespace)
		return cls.apis[namespace]

	@classmethod
	def validate(cls, options):
		valid = True

		for api_name in cls.apis:
			if options.verbose == 1:
				print "Validating %s" % api_name

			api = cls.apis[api_name]
			if not hasattr(api, "type"):
				valid = False
				print "API (namespace:'%s') does not have a type!" % api_name
				print "Is there a file describing it?"

		return valid

	def __init__(self, namespace):
		self.namespace = namespace
		self.methods = []
		self.modules = []
		self.objects = []
		self.properties = []
		self.examples = []
		self.type = 'object'
		self.deprecated = None
		self.description = ''
		self.events = []
		self.platforms = []

	def update(self, data):
		self.type = type = data['type']
		if 'platforms' in data:
			self.platforms = data['platforms']
		if type == "property"		:
			self.returns = data['returns']
		if type == "method" or type == "function":
			self.type = "method"
			self.returns = data['returns']
			self.parameters = []

			if not 'parameters' in data:
				params = []
			else:
				params = data['parameters']
			for param in params:
				if len(param) < 3:
					param = (param[0], param[1], "")	
				self.parameters.append({
					'type': param[0],
					'name': param[1],
					'description': param[2]
				})
		desc = data['description']
		if desc:
			desc = desc.replace('<pre><code>','<script type="syntaxhighlighter" class="brush: js"><![CDATA[')
			desc = desc.replace('</code></pre>',']]></script>')
		self.description = desc
		self.since = data['since']
		self.deprecated = 'deprecated' in data and data['deprecated']
		if 'events' in data:
			self.events = data['events']

		if self.parent_name():
			self.get_api(self.parent_name()).add_child(self)

	def add_child(self, child):
		if child.type == 'method':
			self.methods.append(child)
		elif child.type == 'property':
			self.properties.append(child)
		elif child.type == 'object':
			self.objects.append(child)
		elif child.type == 'module':
			self.modules.append(child)

	def name(self):
		loc = self.namespace.rfind('.')
		if loc == -1: # Top-level namespace
			return self.namespace
		return self.namespace[loc + 1:]

	def parent_name(self):
		loc = self.namespace.rfind('.')
		if loc == -1:
			return None
		return self.namespace[:loc]

	def get_html_template(self):
		global template_dir
		if not self.type in API.templates:
			tpath = path.join(template_dir, '%s.html' % self.type)
			if not path.exists(tpath):
				print "Couldn't find template: %s" % tpath
				sys.exit(1)
			API.templates[self.type] = open(tpath).read()
		return API.templates[self.type]

	def __cmp__(self, other):
		return cmp(self.namespace, other.namespace)
		
def add_api(yaml_string):
	data = yaml.load(yaml_string)
	api = API.get_api(data['namespace'])
	api.update(data)

def spit_html(options, api):
	global search_json
	
	try:
		template = api.get_html_template()
		output = Template(template).render(data=api)
	except:
		print exceptions.html_error_template().render()
		return


	outdir = options.outdir
	if not path.exists(outdir):
		os.makedirs(outdir)

	f = open(path.join(outdir, '%s.html' % api.namespace), 'w+')
	f.write(output)
	f.close()
	
	# simply create a search index of tokens that the webserver will use to do doc searchs against
	search_json.append({
		'filename':api.namespace,
		'content':'%s %s %s' % (api.namespace," ".join(api.namespace.split('.')),api.description),
		'type':api.type
	})
	
	if api.type == 'module':
		toc_filename = os.path.join(outdir,'toc_%s.json' % api.namespace)
		f = open(toc_filename,'w+')
		methods = []
		properties = []
		for m in api.methods:
			methods.append(m.name())
		for m in api.properties:
			properties.append(m.name())
		methods.sort()
		properties.sort()
		f.write(json.dumps({'methods':methods,'properties':properties},indent=4))
		f.close()
	
def crawl(srcdir, options):
	for root, dirs, files in os.walk(srcdir):
		for file in files:
			if not path.splitext(file)[-1] == '.yml':
				continue
			file = path.join(root, file)

			if options.verbose == 1:
				print "Processing %s" % file
			add_api(open(file).read())

def spit_toc(apis,outdir):
	ns = []
	for key in apis.keys():
		if apis[key].type == 'module':
			print ">> found module: %s" % key
			ns.append(key)
	ns.sort()
	toc = open(os.path.join(outdir,'toc.json'),'w+')
	toc.write(json.dumps(ns,indent=4))
	toc.close()
	
def spit_search_json(searchjson,outdir):
	out = open(os.path.join(outdir,'search.json'),'w+')
	out.write(json.dumps(searchjson,indent=4))
	out.close()
		
if __name__ == "__main__":
	global template_dir, search_json

	usage = "usage: %prog [options] arg1 arg2"
	parser = OptionParser(usage=usage)
	parser.add_option("-o", "--output-dir", dest="outdir", default='docout',
		help="output rendered documentation to DIR", metavar="DIR")
	parser.add_option("-s", "--source-dir", dest="srcdir", default='.',
		help="read documentation source from DIR")
	parser.add_option("-t", "--template-dir", dest="template_dir", default='X',
		help="read documentation source from DIR")
	parser.add_option("-m", "--html-only", dest="html_only", default=False,
		help="only render documentation to HTML")
	parser.add_option("-j", "--json-only", dest="json_only", default=False,
		help="only render documentation to JSON")
	parser.add_option('-v', '--verbose', dest='verbose', action='count',
		help="Specifies verbose output")

	(options, args) = parser.parse_args()
	if options.template_dir == 'X':
		template_dir = os.path.join(options.srcdir,'templates')
	else:
		template_dir = options.template_dir
	search_json = []

	crawl(options.srcdir, options)

	if not API.validate(options):
		sys.exit(1)

	if not options.json_only:
		for api_name in API.apis:
			if options.verbose == 1:
				print "Spitting HTML: %s" % api_name
			spit_html(options, API.apis[api_name])
		spit_toc(API.apis,options.outdir)	
		spit_search_json(search_json,options.outdir)

	# JSON forthcomming.
	# if not options.html_only:
	# 	for api in API.apis:
	# 		spit_json(options, api)
