#!/usr/bin/env python
#
# Copyright (c) 2010-2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.

import os, sys, traceback
import re, optparse
import generators
from common import log, msg, err, info, warn, lazyproperty, dict_has_non_empty_member

try:
	import yaml
except:
	print >> sys.stderr, "You don't have pyyaml!\n"
	print >> sys.stderr, "You can install it with:\n"
	print >> sys.stderr, ">  sudo easy_install pyyaml\n"
	print >> sys.stderr, ""
	sys.exit(1)

this_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

# We package the python markdown module already in the sdk source tree,
# namely in /support/module/support/markdown.  So go ahead and  use it
# rather than rely on it being easy_installed.
module_support_dir = os.path.abspath(os.path.join(this_dir, '..', 'support', 'module', 'support'))
if os.path.exists(module_support_dir):
	sys.path.append(module_support_dir)
try:
	import markdown
except:
	msg("You don't have markdown!\n")
	msg("You can install it with:\n")
	msg(">  easy_install ElementTree\n")
	msg(">  easy_install Markdown\n")
	msg("")
	sys.exit(1)

DEFAULT_PLATFORMS = ["android", "iphone", "ipad"]
DEFAULT_SINCE = "0.8"
apis = {} # raw conversion from yaml
annotated_apis = {} # made friendlier for templates, etc.
current_api = None
ignore_dirs = ('.git','.svn', 'CVS')

def has_ancestor(one_type, ancestor_name):
	if "extends" in one_type and one_type["extends"] == ancestor_name:
		return True
	elif "extends" not in one_type:
		return False
	else:
		parent_type_name = one_type["extends"]
		if parent_type_name is None or not hasattr(parent_type_name, "splitlines") or parent_type_name.lower() == "object":
			return False
		if not parent_type_name in apis:
			warn("%s extends %s but %s type information not found" % (one_type["name"], parent_type_name, parent_type_name))
			return False
		return has_ancestor(apis[parent_type_name], ancestor_name)

def is_titanium_module(one_type):
	return has_ancestor(one_type, "Titanium.Module")

def is_titanium_proxy(one_type):
	# When you use this, don't forget that modules are also proxies
	return has_ancestor(one_type, "Titanium.Proxy")

# iphone -> iPhone, etc.
def pretty_platform_name(name):
	if name.lower() == "iphone":
		return "iPhone"
	if name.lower() == "ipad":
		return "iPad"
	if name.lower() == "blackberry":
		return "Blackberry"
	if name.lower() == "android":
		return "Android"

# obj can be a type, method, property or event from the yaml
def combine_platforms_and_since(obj):
	result = []
	platforms = DEFAULT_PLATFORMS
	since = DEFAULT_SINCE
	if "platforms" in obj and len(obj["platforms"]) > 0:
		platforms = obj["platforms"]
	if "since" in obj and len(obj["since"]) > 0:
		since = obj["since"]
	since_is_dict = hasattr(since, "has_key")
	for name in platforms:
		one_platform = {"name": name, "pretty_name": pretty_platform_name(name)}
		if not since_is_dict:
			one_platform["since"] = since
		else:
			if name in since:
				one_platform["since"] = since[name]
			else:
				one_platform["since"] = DEFAULT_SINCE
		result.append(one_platform)
	return result

def load_one_yaml(filepath):
	f = None
	try:
		f = open(filepath, "r")
		types = [the_type for the_type in yaml.load_all(f)]
		return types
	except:
		e = traceback.format_exc()
		err("Exception occured while processing %s:" % filepath)
		for line in e.splitlines():
			err(line)
		return None
	finally:
		if f is not None:
			try:
				f.close()
			except:
				pass

def generate_output(options):
	for output_type in options.formats.split(","):
		try:
			__import__("generators.%s_generator" % output_type)
		except:
			err("Output format %s is not recognized" % output_type)
			sys.exit(1)
		if annotated_apis is None or len(annotated_apis) == 0:
			annotate_apis()
		generator = getattr(generators, "%s_generator" % output_type)
		generator.generate(apis, annotated_apis, options)

def process_yaml():
	global apis
	for root, dirs, files in os.walk(this_dir):
		for name in ignore_dirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for filename in files:
			if os.path.splitext(filename)[-1] != '.yml' or filename=='template.yml':
				continue
			filepath = os.path.join(root, filename)
			info("Processing: %s" % filepath)
			types = None
			types = load_one_yaml(filepath)
			if types is None:
				info("%s skipped" % filepath)
			else:
				for one_type in types:
					if one_type["name"] in apis:
						warn("%s has a duplicate" % one_type["name"])
					apis[one_type["name"]] = one_type

def annotate_apis():
	global apis, annotated_apis
	for name in apis:
		if not name.startswith("Titanium"):
			continue
		info("annotating %s" % name)
		one_api = apis[name]
		one_annotated_api = None
		if is_titanium_module(one_api):
			annotated_apis[name] = AnnotatedModule(one_api)
		elif is_titanium_proxy(one_api):
			annotated_apis[name] = AnnotatedProxy(one_api)
	# Give each annotated api a direct link to its annotated parent
	for name in annotated_apis:
		if name == "Titanium":
			continue # Titanium has no parent
		else:
			parent_name = ".".join(name.split(".")[:-1])
			if parent_name not in annotated_apis:
				warn("%s's parent, %s, cannot be located" % (name, parent_name))
			else:
				annotated_apis[name].parent = annotated_apis[parent_name]

# Takes a documented api (module, proxy, method, property, event, etc.)
# originally from YAML and provides convenience properties and methods to
# assist with outputting to templates or other formats.
class AnnotatedApi(object):
	def __init__(self, api_obj):
		self.api_obj = api_obj
		self.name = api_obj["name"]
		self.parent = None
		self.typestr = None
		self.platforms = combine_platforms_and_since(api_obj)
		self.yaml_source_folder = ""
		self.completed_annotations = []

	def is_annotated_for_format(self, output_format):
		return output_format in self.completed_annotations

	def set_annotation_complete(self, output_format):
		if not output_format in self.completed_annotations:
			self.completed_annotations.append(output_format)

class AnnotatedProxy(AnnotatedApi):
	def __init__(self, api_obj):
		AnnotatedApi.__init__(self, api_obj)
		self.typestr = "proxy"

	def build_method_list(self):
		methods = []
		if dict_has_non_empty_member(self.api_obj, "methods"):
			methods = [AnnotatedMethod(m, self) for m in self.api_obj["methods"]]
		self.append_inherited_methods(methods)
		return sorted(methods, key=lambda item: item.name)

	@lazyproperty
	def methods(self):
		return self.build_method_list();

	@lazyproperty
	def properties(self):
		properties = []
		if dict_has_non_empty_member(self.api_obj, "properties"):
			properties = [AnnotatedProperty(p, self) for p in self.api_obj["properties"]]
		self.append_inherited_properties(properties)
		return sorted(properties, key=lambda item: item.name)

	@lazyproperty
	def events(self):
		events = []
		if dict_has_non_empty_member(self.api_obj, "events"):
			events = [AnnotatedEvent(e, self) for e in self.api_obj["events"]]
		self.append_inherited_events(events)
		return sorted(events, key=lambda item: item.name)

	def append_inherited_methods(self, methods):
		pass # TODO

	def append_inherited_properties(self, properties):
		pass # TODO

	def append_inherited_events(self, events):
		pass # TODO

class AnnotatedModule(AnnotatedProxy):
	def __init__(self, api_obj):
		AnnotatedProxy.__init__(self, api_obj)
		self.typestr = "module"
		self.yaml_source_folder = os.path.join(this_dir, self.name.replace(".", os.sep))

	def append_creation_methods(self, methods):
		proxies = self.member_proxies
		for proxy in proxies:
			method_obj = {}
			method_obj["name"] = "create%s" % proxy.name.split(".")[-1]
			method_obj["description"] = "Create and return an instance of <%s>." % proxy.name
			param_obj = {}
			param_obj["name"] = "parameters"
			param_obj["type"] = "Object"
			param_obj["description"] = "(Optional) A dictionary object with properties defined in <%s>" % proxy.name
			method_obj["parameters"] = [param_obj]
			method_obj["returns"] = {"type": proxy.name}
			methods.append(AnnotatedMethod(method_obj, self))

	@lazyproperty
	def member_proxies(self):
		global annotated_apis
		proxies = []
		for one_annotated_type in annotated_apis.values():
			if one_annotated_type.parent is self and one_annotated_type.typestr == "proxy":
				one_annotated_type.yaml_source_folder = self.yaml_source_folder
				proxies.append(one_annotated_type)
		return sorted(proxies, key=lambda item: item.name)

	@lazyproperty
	def methods(self):
		methods = self.build_method_list()
		self.append_creation_methods(methods)
		return sorted(methods, key=lambda item: item.name)

class AnnotatedMethod(AnnotatedApi):
	def __init__(self, api_obj, annotated_parent):
		AnnotatedApi.__init__(self, api_obj)
		self.typestr = "method"
		self.parent = annotated_parent
		self.yaml_source_folder = self.parent.yaml_source_folder

	@lazyproperty
	def parameters(self):
		parameters = []
		if dict_has_non_empty_member(self.api_obj, "parameters"):
			parameters = [AnnotatedMethodParameter(p, self) for p in self.api_obj["parameters"]]
		return parameters


class AnnotatedMethodParameter(AnnotatedApi):
	def __init__(self, api_obj, annotated_parent):
		AnnotatedApi.__init__(self, api_obj)
		self.parent = annotated_parent
		self.typestr = "parameter"
		self.yaml_source_folder = self.parent.yaml_source_folder

class AnnotatedProperty(AnnotatedApi):
	def __init__(self, api_obj, annotated_parent):
		AnnotatedApi.__init__(self, api_obj)
		self.typestr = "property"
		self.parent = annotated_parent
		self.yaml_source_folder = self.parent.yaml_source_folder

class AnnotatedEvent(AnnotatedApi):
	def __init__(self, api_obj, annotated_parent):
		AnnotatedApi.__init__(self, api_obj)
		self.typestr = "event"
		self.parent = annotated_parent
		self.yaml_source_folder = self.parent.yaml_source_folder

	@lazyproperty
	def properties(self):
		properties = []
		if dict_has_non_empty_member(self.api_obj, "properties"):
			properties = [AnnotatedProperty(p, self) for p in self.api_obj["properties"]]
		return sorted(properties, key=lambda item: item.name)

def main():
	titanium_dir = os.path.dirname(this_dir)
	dist_apidoc_dir = os.path.join(titanium_dir, 'dist', 'apidoc')
	sys.path.append(os.path.join(titanium_dir, 'build'))
	import titanium_version

	parser = optparse.OptionParser()
	parser.add_option('-f', '--formats', dest='formats', help='Comma-separated list of desired output formats.  "html" is default.', default='html')
	parser.add_option('--css', dest='css', help='Path to a custom CSS stylesheet to use in each HTML page', default=None)
	parser.add_option('-o', '--output', dest='output', help='Output directory for generated documentation', default=dist_apidoc_dir)
	parser.add_option('-v', '--version', dest='version', help='Version of the API to generate documentation for', default=titanium_version.version)
	parser.add_option('--colorize', dest='colorize', action='store_true', help='Colorize code in examples', default=False)
	(options, args) = parser.parse_args()
	
	process_yaml()
	generate_output(options)
	info("%s types processed" % len(apis))

if __name__ == "__main__":
	main()
