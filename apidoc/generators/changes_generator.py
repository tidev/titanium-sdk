#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)

import os, sys, re

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from common import dict_has_non_empty_member

# We package the python markdown and mako modules already in /support/common
common_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "common"))
sys.path.append(common_support_dir)
import markdown
from mako.template import Template
from mako.lookup import TemplateLookup

android_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "android"))
sys.path.append(android_support_dir)
from tilogger import *
log = TiLogger(None)

template_cache = {} # cache templates so we don't need to load them each time
template_dir = os.path.abspath(os.path.join(this_dir, "..", "templates", "changes"))
template_lookup = TemplateLookup(directories=[template_dir])

all_annotated_apis = None
apis = None

try:
	from pygments import highlight
	from pygments.formatters import HtmlFormatter
	from pygments.lexers import get_lexer_by_name
except:
	print >> sys.stderr, "You don't have Pygments!\n"
	print >> sys.stderr, "You can install it with:\n"
	print >> sys.stderr, ">  easy_install Pygments"
	print ""
	sys.exit(1)


# Versions are in the format "maj.min.micro.qualifier"
# Version parts may be omitted in the docs. Normalize to 
# three digits for comparison purposes.
def normalize_version(version_str):
	version = version_str.split(".")
	normalized_version = ["0", "0", "0"]
	for i in range(3):  
		if (i <len(version)):
			normalized_version[i] = version[i]
	
	return normalized_version;

# only works for proxies or modules
def find_supertype(annotated_obj):
	supertype = None
	extends = None
	if annotated_obj.api_obj.has_key("extends"):
		extends = annotated_obj.api_obj["extends"];
	if extends and all_annotated_apis.has_key(extends):
		supertype = all_annotated_apis[extends]
	return supertype

def find_supertype_member(annotated_obj):
	list_names = { "method": "methods", "event":"events" }
	sublist_name = None
	if annotated_obj.typestr == "method" or annotated_obj.typestr == "event":
		supertype = find_supertype(annotated_obj.parent)
		list_name = list_names[annotated_obj.typestr]
	if annotated_obj.typestr == "parameter":
		supertype = find_supertype(annotated_obj.parent.parent)
		list_name = "methods"
		sublist_name = "parameters"  
	if annotated_obj.typestr == "property":
		if annotated_obj.parent.typestr == "event":
			supertype = find_supertype(annotated_obj.parent.parent)
			list_name = "events"
			sublist_name = "properties"
		else:
			supertype = find_supertype(annotated_obj.parent)
			list_name = "properties"

	if supertype is not None:
		found = None
		if sublist_name is not None:
			member_name = annotated_obj.parent.name
		else:
			member_name = annotated_obj.name
		if has_list_attr(supertype, list_name):
			member_list = getattr(supertype, list_name)
			for one_member in member_list:
				if one_member.name == member_name:
					found = one_member
					break
			if found is not None and sublist_name is not None:
				if has_list_attr(found, sublist_name):
					member_list = getattr(found, sublist_name)
					for one_member in member_list:
						if one_member.name == annotated_obj.name:
							return annotated_obj
			else:
				return found
	return None

def full_type_name(annotated_obj):
	typename = ""
	if annotated_obj.typestr == "module" or annotated_obj.typestr == "proxy":
		typename =  annotated_obj.name
	if annotated_obj.typestr == "method" or annotated_obj.typestr == "event":
		typename =  "%s.%s" % (annotated_obj.parent.name, annotated_obj.name)
	if annotated_obj.typestr == "property":
		if annotated_obj.parent.typestr == "event":
			typename =  "%s.%s.%s" % (annotated_obj.parent.parent.name, annotated_obj.parent.name, annotated_obj.name)
		else:
			typename =  "%s.%s" % (annotated_obj.parent.name,  annotated_obj.name)
	if annotated_obj.typestr == "parameter":
		typename =  "%s.%s.%s" % (annotated_obj.parent.parent.name, annotated_obj.parent.name, annotated_obj.name)
	return typename

def has_list_attr(object, listattr):
	return hasattr(object, listattr) and type(getattr(object, listattr)) == list

def platforms_list_to_dict(platforms_list):
	platform_dict = { }
	for platform in platforms_list:
		platform_dict[platform["name"]] = normalize_version(platform["since"])
	return platform_dict

def is_new_api(annotated_obj, this_version):
	# Checking for none here lets us call is_new_api(find_supertype_member(foo)) without additional checking
	if annotated_obj is None:
		return None

	obj = annotated_obj.api_obj
	platforms = [ "android", "iphone", "ipad", "mobileweb" ]
	platform_names = { "android": "Android", "iphone": "iPhone", "ipad": "iPad", "mobileweb": "Mobile Web" }

	if hasattr(annotated_obj, "platforms") and len(annotated_obj.platforms) > 0:
		since = annotated_obj.platforms
	else:
		return None

	support_str = ""
	new_for_platform = []
	since_for_platform = {}
	existing_api = False

	# if we have both a superclass and a parent object, we only consider the since versions
	# for platforms shared by *both* parent object and superclass, i.e., a property defined 
	# for all platforms in Ti.Proxy only needs to be supported on Android in a Ti.Android object.
	# Our platforms list is already constrained by the parent object, so we iterate through
	# it and check whether it's similarly defined in the supertype... Whew!
	super_platforms = None
	if not annotated_obj.typestr in [ "module", "proxy" ]:
		super = find_supertype_member(annotated_obj)
		if super is not None and super.platforms is not None:
			super_platforms = platforms_list_to_dict(super.platforms)

	for platform_since in since:
		platform_name = platform_since["name"]
		platform_version = normalize_version(platform_since["since"])
		if platform_version == this_version:
			if super_platforms is not None and platform_name in super_platforms and super_platforms[platform_name] == this_version:
				existing_api = True
			else:
				new_for_platform.append(platform_names[platform_since["name"]])
		elif platform_version < this_version:
			existing_api = True

	num_platforms = len(new_for_platform)
	if (num_platforms >= 1):
		if existing_api: 
			support_str = "Added support for %s" % new_for_platform[0]
		else: 
			support_str = "New API, supported on %s" % new_for_platform[0]
		for i in range(1, num_platforms):
			if (i == num_platforms-1):
				support_str += " and %s" % new_for_platform[i]
			else:
				support_str += ", %s" % new_for_platform[i]

	if support_str:
		return { "new": not existing_api, "notes": support_str }

def is_removed_or_deprecated_api(annotated_obj, this_version):
	if annotated_obj.deprecated != None:
		if annotated_obj.deprecated.has_key("removed") and normalize_version(str(annotated_obj.deprecated["removed"])) == this_version:
				return "removed"
		elif (normalize_version(str(annotated_obj.deprecated["since"])) == this_version):
			return "deprecated"
	return None

def is_removed_api(annotated_obj, this_version):
	if annotated_obj.deprecated != None:
		if (normalize_version(str(annotated_obj.deprecated["removed"])) == this_version):
			return True
	return False

def is_deprecated_in_supertype(member, removed_or_deprecated):
	supertype_member = find_supertype_member(member)
	if supertype_member:
		if removed_or_deprecated == "deprecated":
			if supertype_member.deprecated != None and supertype_member.deprecated["since"] == member.deprecated["since"]:
				return True
		else:
			if supertype_member.deprecated != None and hasattr(supertype_member.deprecated, "removed") and supertype_member.deprecated["removed"] == member.deprecated["removed"]:
				return True
	return False

link_parts_re = re.compile(r"(?:\[([^\]]+?)\]\(([^\)\s]+?)\)|\<([^\>\s]+)\>)", re.MULTILINE)

def markdown_to_html(markdown_string):
	# remove links for this report
	match = link_parts_re.search(markdown_string)
	while match:
		if match.group(1):
			markdown_string = markdown_string.replace(match.group(0), match.group(1))
		elif match.group(3):
			markdown_string = markdown_string.replace(match.group(0), match.group(3))
		match = link_parts_re.search(markdown_string)

	html = markdown.markdown(markdown_string) 
	return html

def render_template(list, type, version):
	template = None
	if template_cache.has_key(type):
		template = template_cache[type]
	else:
		template_file = os.path.join(template_dir, "%s.html" % type)
		template = template_lookup.get_template("%s.html" % type)
		template_cache[type] = template
	output = template.render(config={ "version" : version }, data=list)
	return output

def generate(raw_apis, annotated_apis, options):
	global all_annotated_apis, apis
	all_annotated_apis = annotated_apis
	apis = raw_apis

	if options is not None and (not hasattr(options, "output") or options.output is None or len(options.output) == 0):
		log.error ("'output' option not provided")
		sys.exit(1)
	if options is not None and (not hasattr(options, "version") or options.version is None or len(options.version) == 0):
		log.error ("'version' option not provided")
		sys.exit(1)

	if options is not None and not os.path.exists(options.output):
		os.makedirs(options.output)

	version = normalize_version(options.version)
	outfile = "changes_%s.html" % ".".join(version)

	# Write the output files
	deprecated = []
	removed = []
	added = []
	if options is not None:
		for name in annotated_apis:
			annotated_obj = annotated_apis[name]
			supertype = find_supertype(annotated_obj)
			list_names = [ "methods", "properties", "events" ]
			
			new_api = is_new_api(annotated_obj, version)
			if new_api is not None:
				notes = ""
				if new_api.has_key("notes"):
					notes = " (%s.)" % new_api["notes"]
				added.append({ "name": full_type_name(annotated_obj),
								"type": { "proxy": "object", "module":"module" }[annotated_obj.typestr],
								"summary": markdown_to_html(annotated_obj.api_obj["summary"] + notes) })
			else:
				for list_name in list_names:
					if has_list_attr(annotated_obj, list_name):
						member_list = getattr(annotated_obj, list_name)
						for m in member_list:
							new_api = is_new_api(m, version)
							if new_api is not None:
								notes = ""
								if new_api.has_key("notes"):
									notes = " (%s.)" % new_api["notes"]
								added.append({ "name": full_type_name(m),
												"type": m.typestr,
												"summary": markdown_to_html(m.api_obj["summary"] + notes) })
							elif list_name == "methods" or list_name == "events":
								sublist_name = { "methods": "parameters", "events": "properties" }[list_name]
								if has_list_attr(m, sublist_name):
									sublist = getattr(m, sublist_name)
									for p in sublist:
										new_api = is_new_api(p, version)
										if new_api is not None:
											notes = ""
											if new_api.has_key("notes"):
												notes = " (%s.)" % new_api["notes"]
											added.append({ "name": full_type_name(p),
															"type": { "methods": "parameter", "events": "event property" }[list_name],
															"summary": markdown_to_html(p.api_obj["summary"] + notes) })


			removed_or_deprecated = is_removed_or_deprecated_api(annotated_obj, version)
			if removed_or_deprecated:
				notes = ""
				if annotated_obj.deprecated.has_key("notes"):
					notes = markdown_to_html(annotated_obj.deprecated["notes"])
				deprecation = { "name": full_type_name(annotated_obj),
								"type": { "proxy": "object", "module":"module" }[annotated_obj.typestr],
								"notes": notes }
				if removed_or_deprecated == "deprecated":
					deprecated.append(deprecation)
				else:
					removed.append(deprecation)

			parent_removed_or_deprecated = removed_or_deprecated
			for list_name in list_names:
				if has_list_attr(annotated_obj, list_name):
					member_list = getattr(annotated_obj, list_name)
					for m in member_list:
						# Do not insert deprecation/removal records if the parent deprecation matches... But if we deprecate an object in the 
						# same release that we remove one of its members, we must list both.
						m_removed_or_deprecated = is_removed_or_deprecated_api(m, version)
						if m_removed_or_deprecated and m_removed_or_deprecated != parent_removed_or_deprecated:
							# if inherited AND the parent has deprecated this property, omit it.
							if supertype is not None and is_deprecated_in_supertype(m, m_removed_or_deprecated):
								pass
							else:
								notes = ""
								if m.deprecated.has_key("notes"):
									notes = markdown_to_html(m.deprecated["notes"])
								deprecation = { "name": full_type_name(m),
														  "type": m.typestr,
														  "notes": notes }
								if m_removed_or_deprecated == "deprecated":
									deprecated.append(deprecation)
								else:
									removed.append(deprecation)

						if list_name == "methods" or list_name == "events":
							sublist_name = { "methods": "parameters", "events": "properties" }[list_name]
							if has_list_attr(m, sublist_name):
								sublist = getattr(m, sublist_name)
								for p in sublist:
									# Omit the removal/deprecation if the containing method/event is similarly deprecated or removed.
									# Do we need to also check the parent object?
									p_removed_or_deprecated = is_removed_or_deprecated_api(p, version)
									if p_removed_or_deprecated and p_removed_or_deprecated != m_removed_or_deprecated and p_removed_or_deprecated != parent_removed_or_deprecated:
										if supertype is not None and is_deprecated_in_supertype(p, p_removed_or_deprecated):
											# supertype_member = find_supertype_member(m, getattr(supertype, list_name))
											#supertype_member = find_supertype_member(m)
											#if has_list_attr(supertype_member, sublist_name):
											#	if is_deprecated_in_supertype(p, getattr(supertype_member, sublist_name), p_removed_or_deprecated):
											continue
										notes = ""
										if p.deprecated.has_key("notes"):
											notes = markdown_to_html(p.deprecated["notes"])
										deprecation = { "name": full_type_name(p),
											 "type": { "events" : "event property", "methods" : "parameter" }[list_name],
											 "notes": notes }
										if p_removed_or_deprecated == "deprecated":
											deprecated.append(deprecation)
										else:
											removed.append(deprecation)

		log.info("Creating %s in %s" % (outfile, options.output))
		log.info("Found %d new APIs,  %d deprecated, %d removed" % (len(added), len(deprecated), len(removed)))
		output = open(os.path.join(options.output, outfile), "w")
		if len(added) > 0:
			added.sort(key=lambda record: record["name"].split("."))
			output.write(render_template(added, "new_summary", ".".join(version)));
		if len(deprecated) > 0:
			deprecated.sort(key=lambda record: record["name"].split("."))
			output.write(render_template(deprecated, "deprecation_summary", ".".join(version)));
		if len(removed) > 0:
			removed.sort(key=lambda record: record["name"].split("."))
			output.write(render_template(removed, "removed_summary", ".".join(version)));
		output.close()
