#!/usr/bin/env python
#
# Copyright (c) 2010-2012 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# parse out Titanium API documentation templates into a 
# format that can be used by other documentation generators
# such as PDF, etc.
import os, sys, traceback
import re, optparse
import generators
from common import lazyproperty, dict_has_non_empty_member, not_real_titanium_types

try:
	import yaml
except:
	print >> sys.stderr, "You don't have pyyaml!\n"
	print >> sys.stderr, "You can install it with:\n"
	print >> sys.stderr, ">  sudo easy_install pyyaml\n"
	print >> sys.stderr, ""
	sys.exit(1)

this_dir = os.path.dirname(os.path.abspath(__file__))

# We package markdown and mako in support/common.
common_support_dir = os.path.abspath(os.path.join(this_dir, "..", "support", "common"))
sys.path.append(common_support_dir)
import markdown
from mako.template import Template

# TiLogger is in support/android
android_support_dir = os.path.abspath(os.path.join(this_dir, "..", "support", "android"))
sys.path.append(android_support_dir)
from tilogger import *
log = TiLogger(None)

DEFAULT_PLATFORMS = ["android", "iphone", "ipad", "mobileweb"]
DEFAULT_SINCE = "0.8"
DEFAULT_MOBILEWEB_SINCE = "1.8"
apis = {} # raw conversion from yaml
annotated_apis = {} # made friendlier for templates, etc.
current_api = None
ignore_dirs = (".git", ".svn", "CVS")
ignore_files = ("template.yml",)
warn_inherited = False # see optparse option with same name in main()

def has_ancestor(one_type, ancestor_name):
	if one_type["name"] == ancestor_name:
		return True
	if "extends" in one_type and one_type["extends"] == ancestor_name:
		return True
	elif "extends" not in one_type:
		return False
	else:
		parent_type_name = one_type["extends"]
		if (parent_type_name is None or not isinstance(parent_type_name, basestring) or
				parent_type_name.lower() == "object"):
			return False
		if not parent_type_name in apis:
			log.warn("%s extends %s but %s type information not found" % (one_type["name"],
				parent_type_name, parent_type_name))
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
	if name.lower() == "mobileweb":
		return "Mobile Web"

def combine_platforms_and_since(annotated_obj):
	parent = annotated_obj.parent
	obj = annotated_obj.api_obj
	result = []
	platforms = None
	since = DEFAULT_SINCE
	if dict_has_non_empty_member(obj, "platforms"):
		platforms = obj["platforms"]
	# Method/property/event can't have more platforms than the types they belong to.
	if (platforms is None or
			isinstance(annotated_obj, AnnotatedMethod) or isinstance(annotated_obj, AnnotatedProperty) or
			isinstance(annotated_obj, AnnotatedEvent)):
		if parent is not None:
			if dict_has_non_empty_member(parent.api_obj, "platforms"):
				if platforms is None or len(parent.api_obj["platforms"]) < len(platforms):
					platforms = parent.api_obj["platforms"]
	# Last resort is the default list of platforms
	if platforms is None:
		platforms = DEFAULT_PLATFORMS
	if "since" in obj and len(obj["since"]) > 0:
		since = obj["since"]
	else:
		# If a method/event/property we can check type's "since"
		if (isinstance(annotated_obj, AnnotatedMethod) or isinstance(annotated_obj, AnnotatedProperty) or
				isinstance(annotated_obj, AnnotatedEvent)):
			if (parent is not None and
					dict_has_non_empty_member(parent.api_obj, "since")):
				since = parent.api_obj["since"]

	since_is_dict = isinstance(since, dict)
	for name in platforms:
		one_platform = {"name": name, "pretty_name": pretty_platform_name(name)}
		if not since_is_dict:
			one_platform["since"] = since
			if one_platform["name"] == "mobileweb":
				if len(since) >= 3:
					if float(since[0:3]) < float(DEFAULT_MOBILEWEB_SINCE[0:3]):
						one_platform["since"] = DEFAULT_MOBILEWEB_SINCE
		else:
			if name in since:
				one_platform["since"] = since[name]
			else:
				if one_platform["name"] == "mobileweb":
					one_platform["since"] = DEFAULT_MOBILEWEB_SINCE
				else:
					one_platform["since"] = DEFAULT_SINCE
		result.append(one_platform)

	# Be sure no "since" is _before_ a parent object since.
	if parent and parent.platforms:
		for entry in result:
			platform_name = entry["name"]
			version_parts = entry["since"].split(".")
			for parent_entry in parent.platforms:
				if parent_entry["name"] == platform_name:
					parent_version_parts = parent_entry["since"].split(".")
					if parent_version_parts > version_parts:
						entry["since"] = parent_entry["since"]
					break
	return result

def load_one_yaml(filepath):
	f = None
	try:
		f = open(filepath, "r")
		types = [the_type for the_type in yaml.load_all(f)]
		return types
	except KeyboardInterrupt:
		raise
	except:
		log.error("Exception occurred while processing %s:" % filepath)
		raise
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
			log.error("Output format %s is not recognized" % output_type)
			sys.exit(1)
		if annotated_apis is None or len(annotated_apis) == 0:
			annotate_apis()
		generator = getattr(generators, "%s_generator" % output_type)
		generator.generate(apis, annotated_apis, options)

def process_yaml():
	global apis
	log.info("Parsing YAML files")
	for root, dirs, files in os.walk(this_dir):
		for name in ignore_dirs:
			if name in dirs:
				dirs.remove(name) # don't visit ignored directoriess
		for filename in files:
			if os.path.splitext(filename)[-1] != ".yml" or filename in ignore_files:
				continue
			filepath = os.path.join(root, filename)
			log.trace("Processing: %s" % filepath)
			types = None
			types = load_one_yaml(filepath)
			if types is None:
				log.trace("%s skipped" % filepath)
			else:
				for one_type in types:
					if one_type["name"] in apis:
						log.warn("%s has a duplicate" % one_type["name"])
					apis[one_type["name"]] = one_type

# If documentation for a method/event/property only "partially overrides"
# the documentation for the super type, this will fill in the rest of
# the documentation by inheriting it from the super type.
def finish_partial_overrides():
	global apis
	log.trace("Finishing partial overrides")
	for name in apis:
		one_api = apis[name]
		if "extends" not in one_api or not one_api["extends"]:
			continue
		super_name = one_api["extends"]
		if super_name not in apis:
			continue
		log.trace("Checking partial overrides in %s by looking at %s" % (name, super_name))
		super_api = apis[super_name]
		for list_name in ("events", "properties", "methods"):
			if list_name not in one_api or list_name not in super_api:
				continue
			api_list = one_api[list_name]
			super_list = super_api[list_name]
			for api_list_member in api_list:
				member_name = api_list_member["name"]
				super_list_member = None
				super_member_set = [m for m in super_list if m["name"] == member_name]
				if not super_member_set:
					continue
				super_list_member = super_member_set[0]
				for key in super_list_member.keys():
					if super_list_member[key] and (key not in api_list_member.keys() or not api_list_member[key]):
						api_list_member[key] = super_list_member[key]
						message = "%s.%s auto-inheriting '%s' documentation attribute from %s.%s" % (
								one_api["name"], member_name, key, super_name, member_name)
						if warn_inherited:
							log.warn(message)
						else:
							log.trace(message)

def annotate_apis():
	global apis, annotated_apis
	log.trace("Annotating api objects")
	for name in apis:
		log.trace("annotating %s" % name)
		one_api = apis[name]
		one_annotated_api = None
		if is_titanium_module(one_api):
			annotated_apis[name] = AnnotatedModule(one_api)
		elif is_titanium_proxy(one_api):
			annotated_apis[name] = AnnotatedProxy(one_api)
		else:
			if one_api["name"].startswith("Ti") and one_api["name"] != "Titanium.Event":
				# Titanium.Event is an exception because it doesn't extend anything and doesn't need
				# to be annotated as a Titanium type.
				log.warn("%s not being annotated as a Titanium type. Is its 'extends' property not set correctly?" % one_api["name"])
			else:
				# Types that are not true Titanium proxies and modules (like pseudo-types)
				# are treated as proxies for documentation generation purposes so that
				# their methods, properties, etc., can be documented.
				annotated_apis[name] = AnnotatedProxy(one_api)
	# Give each annotated api a direct link to its annotated parent
	for name in annotated_apis:
		if "." not in name:
			continue # e.g., "Titanium" has no parent
		else:
			parent_name = ".".join(name.split(".")[:-1])
			if parent_name not in annotated_apis:
				log.warn("%s's parent, %s, cannot be located" % (name, parent_name))
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
		self.typestr = "object"
		self.yaml_source_folder = ""
		self.inherited_from = ""
		if "deprecated" in api_obj:
			self.deprecated = api_obj["deprecated"]
		else:
			self.deprecated = None
		if "permission" in api_obj:
			self.permission = api_obj["permission"]
		else:
			self.permission = None
		if "availability" in api_obj:
			self.availability = api_obj["availability"]
		else:
			self.availability = None
		if "default" in api_obj:
			# TIDOC-708: avoid capitalizing booleans
			if isinstance(api_obj["default"], bool):
				if api_obj["default"]:
					self.default = "true"
				else:
					self.default = "false"
			else:
				self.default = api_obj["default"]
		else:
			self.default = None
		if "optional" in api_obj:
			self.optional = api_obj["optional"]
		else:
			self.optional = None

	@lazyproperty
	def platforms(self):
		return combine_platforms_and_since(self)

class AnnotatedProxy(AnnotatedApi):
	__create_getter_template = None
	__create_setter_template = None

	def __init__(self, api_obj):
		AnnotatedApi.__init__(self, api_obj)
		self.typestr = "proxy"

	@classmethod
	def render_getter_method(cls, getter_template_obj):
		if cls.__create_getter_template is None:
			template_text = open(os.path.join(this_dir, "templates", "property_getter.yml.mako"), "r").read()
			cls.__create_getter_template = Template(template_text)
		rendered = cls.__create_getter_template.render(data=getter_template_obj)
		return rendered

	@classmethod
	def render_setter_method(cls, setter_template_obj):
		if cls.__create_setter_template is None:
			template_text = open(os.path.join(this_dir, "templates", "property_setter.yml.mako"), "r").read()
			cls.__create_setter_template = Template(template_text)
		rendered = cls.__create_setter_template.render(data=setter_template_obj)
		return rendered

	def build_method_list(self):
		methods = []
		if dict_has_non_empty_member(self.api_obj, "methods"):
			methods = [AnnotatedMethod(m, self) for m in self.api_obj["methods"]]
		# Not for "pseudo-types"
		if is_titanium_proxy(self.api_obj):
			self.append_setters_getters(methods)
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

	def append_setters_getters(self, methods):
		def since_for_yaml(since):
			if isinstance(since, basestring):
				new_since = '"%s"' % since
			elif isinstance(since, dict):
				new_since = {}
				for k in since.keys():
					new_since[k] = '"%s"' % since[k]
			return new_since

		existing_method_names = [m.name for m in methods]
		for p in self.properties:
			if p.name.upper() == p.name:
				continue # no constants
			getter_ok = True
			setter_ok = True
			if p.permission == "read-only" or p.availability == "creation":
				setter_ok = False
			if p.permission == "write-only":
				getter_ok = False
			if "accessors" in p.api_obj and not p.api_obj["accessors"]:
				getter_ok = setter_ok = False
			if getter_ok:
				if dict_has_non_empty_member(p.api_obj, "type"):
					data_type = p.api_obj["type"]
					returns_array = []
					if isinstance(data_type, list):
						for t in data_type:
							returns_array.append({"type": t})
					else:
						returns_array.append({"type": data_type})
					p.api_obj["returns_for_getter_template"] = returns_array
				if dict_has_non_empty_member(p.api_obj, "since"):
					p.api_obj["since_for_getter_template"] = since_for_yaml(p.api_obj["since"])
				generated_method = yaml.load(AnnotatedProxy.render_getter_method(p))
				annotated_method = AnnotatedMethod(generated_method, self)
				annotated_method.getter_for = p
				annotated_method.inherited_from = p.inherited_from
				if annotated_method.name not in existing_method_names:
					methods.append(annotated_method)
			if setter_ok:
				if dict_has_non_empty_member(p.api_obj, "since"):
					if getter_ok and dict_has_non_empty_member(p.api_obj, "since_for_getter_template"):
						p.api_obj["since_for_setter_template"] = p.api_obj["since_for_getter_template"]
					else:
						p.api_obj["since_for_setter_template"] = since_for_yaml(p.api_obj["since"])
				generated_method = yaml.load(AnnotatedProxy.render_setter_method(p))
				annotated_method = AnnotatedMethod(generated_method, self)
				annotated_method.setter_for = p
				annotated_method.inherited_from = p.inherited_from
				if annotated_method.name not in existing_method_names:
					methods.append(annotated_method)

	def append_inherited_attributes(self, att_list, att_list_name):
		if not "extends" in self.api_obj:
			return
		super_type_name = self.api_obj["extends"]
		class_type = {"properties": AnnotatedProperty, "methods": AnnotatedMethod,
				"events": AnnotatedEvent}[att_list_name]
		existing_names = [item.name for item in att_list]
		excluded_names = []
		if "excludes" in self.api_obj and att_list_name in self.api_obj["excludes"]:
			excluded_names = self.api_obj["excludes"][att_list_name]

		while (super_type_name is not None and len(super_type_name) > 0
				and super_type_name in apis):
			super_type = apis[super_type_name]
			if dict_has_non_empty_member(super_type, att_list_name):
				for new_item in super_type[att_list_name]:
					if new_item["name"] in existing_names or new_item["name"] in excluded_names:
						continue
					new_instance = class_type(new_item, self)
					new_instance.inherited_from = super_type_name
					att_list.append(new_instance)
					existing_names.append(new_item["name"])
			# Keep going up supertypes
			if "extends" in super_type:
				super_type_name = super_type["extends"]
			else:
				super_type_name = None

	def append_inherited_methods(self, methods):
		self.append_inherited_attributes(methods, "methods")

	def append_inherited_properties(self, properties):
		self.append_inherited_attributes(properties, "properties")

	def append_inherited_events(self, events):
		self.append_inherited_attributes(events, "events")

class AnnotatedModule(AnnotatedProxy):
	__create_proxy_template = None
	@classmethod
	def render_create_proxy_method(cls, method_template_obj):
		if cls.__create_proxy_template is None:
			template_text = open(os.path.join(this_dir, "templates", "create_proxy_method.yml.mako"), "r").read()
			cls.__create_proxy_template = Template(template_text)
		rendered = cls.__create_proxy_template.render(data=method_template_obj)
		return rendered

	def __init__(self, api_obj):
		AnnotatedProxy.__init__(self, api_obj)
		self.typestr = "module"
		self.yaml_source_folder = os.path.join(this_dir, self.name.replace(".", os.sep))

	def append_creation_methods(self, methods):
		proxies = self.member_proxies
		if proxies is None or len(proxies) == 0:
			return
		existing_names = [m.name for m in methods]
		for proxy in proxies:
			if proxy.name in not_real_titanium_types:
				continue
			if "createable" in proxy.api_obj and not proxy.api_obj["createable"]:
				continue
			method_name = "create%s" % proxy.name.split(".")[-1]
			if method_name in existing_names:
				continue
			method_template_obj = {"proxy_name": proxy.name}
			for key in ("platforms", "since", "deprecated"):
				if key in proxy.api_obj:
					method_template_obj[key] = yaml.dump(proxy.api_obj[key])
			generated_method = yaml.load(AnnotatedModule.render_create_proxy_method(method_template_obj))
			methods.append(AnnotatedMethod(generated_method, self))

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
		if "repeatable" in api_obj:
			self.repeatable = api_obj["repeatable"]
		else:
			self.repeatable = None

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
		# Append properties from Titanium.Event.yml
		existing_names = [p.name for p in properties]
		event_super_type = apis.get("Titanium.Event")
		if event_super_type is not None and dict_has_non_empty_member(event_super_type, "properties"):
			for prop in event_super_type["properties"]:
				if prop["name"] in existing_names:
					continue
				new_prop = AnnotatedProperty(prop, self)
				new_prop.inherited_from = "Titanium.Event"
				properties.append(new_prop)
		return sorted(properties, key=lambda item: item.name)

def main():
	global this_dir, log, warn_inherited
	titanium_dir = os.path.dirname(this_dir)
	dist_apidoc_dir = os.path.join(titanium_dir, "dist", "apidoc")
	sys.path.append(os.path.join(titanium_dir, "build"))
	import titanium_version

	parser = optparse.OptionParser()
	parser.add_option("-f", "--formats",
			dest="formats",
			help='Comma-separated list of desired output formats.  "html" is default.',
			default="html")
	parser.add_option("--css",
			dest="css",
			help="Path to a custom CSS stylesheet to use in each HTML page",
			default=None)
	parser.add_option("-o", "--output",
			dest="output",
			help="Output directory for generated documentation",
			default=None)
	parser.add_option("-v", "--version",
			dest="version",
			help="Version of the API to generate documentation for",
			default=titanium_version.version)
	parser.add_option("--colorize",
			dest="colorize",
			action="store_true",
			help="Colorize code in examples",
			default=False)
	parser.add_option("--verbose",
			dest="verbose",
			action="store_true",
			help="Display verbose info messages",
			default=False)
	parser.add_option("--stdout",
			dest="stdout",
			action="store_true",
			help="Useful only for json/jsca. Writes the result to stdout. If you specify both --stdout and --output you'll get both an output file and the result will be written to stdout.",
			default=False)
	parser.add_option("--warn-inherited",
			dest="warn_inherited",
			action="store_true",
			help="Show a warning if the documentation for a method/property/event only partially overrides its super type's documentation, in which case the missing information is inherited from the super type documentation.",
			default=False)
	(options, args) = parser.parse_args()
	warn_inherited = options.warn_inherited
	log_level = TiLogger.INFO
	if options.verbose:
		log_level = TiLogger.TRACE
	log = TiLogger(None, level=log_level, output_stream=sys.stderr)
	if options.output is None and "html" in options.formats:
		log.trace("Setting output folder to %s because html files will be generated and now --output folder was specified" % dist_apidoc_dir)
		options.output = dist_apidoc_dir

	process_yaml()
	finish_partial_overrides()
	generate_output(options)

	titanium_apis = [ta for ta in apis.values() if ta["name"].startswith("Ti")]
	log.info("%s Titanium types processed" % len(titanium_apis))

if __name__ == "__main__":
	main()
