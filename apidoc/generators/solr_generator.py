#!/usr/bin/env python
#
# Copyright (c) 2010-2012 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)

import os, sys, re

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from common import dict_has_non_empty_member, strip_tags, not_real_titanium_types, to_ordered_dict

android_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "android"))
sys.path.append(android_support_dir)

# We package markdown and simplejson in support/common.
common_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "common"))
sys.path.append(common_support_dir)
from markdown import markdown

from tilogger import *
log = None
all_annotated_apis = None

try:
	import json
except:
	import simplejson as json

def build_deprecation_message(api):
	# Returns the message in markdown format.
	result = None
	if api.deprecated:
		result = "  **Deprecated"
		if api.deprecated.has_key("since"):
			result += " since %s." % api.deprecated["since"]
		if api.deprecated.has_key("removed"):
			result += " Removed in %s." % api.deprecated["removed"]
		if api.deprecated.has_key("notes"):
			result += " %s" % api.deprecated["notes"]
		result += "**"
	return result

def to_solr_description(summary, api=None):
	if summary is None:
		return ""
	new_summary = summary
	if api is not None and api.deprecated is not None:
		deprecation_message = build_deprecation_message(api)
		if deprecation_message is not None:
			new_summary += deprecation_message
	return new_summary

def to_solr_examples(api):
	rv = ""
	if dict_has_non_empty_member(api.api_obj, "examples"):
		for example in api.api_obj["examples"]:
			rv += " " + example["title"] + " " + example["example"]
	return rv

def to_solr_type_name(type_info):
	if type_info is None:
		return ""
	if isinstance(type_info, list) or isinstance(type_info, tuple) and len(type_info) > 0:
		if "object" in [t.lower() for t in type_info]:
			return "Object"
		else:
			return to_solr_type_name(type_info[0])
	type_test = type_info
	if type_test.startswith("Callback"):
		type_test ="Function"
	elif type_test.startswith("Array"):
		type_test = "Array"
	elif type_test.startswith("Dictionary<"):
		match = re.findall(r"<([^>]+)>", type_test)
		if match is not None and len(match) > 0:
			type_test = match[0]
	elif type_test == "Dictionary":
		type_test = "Object"
	return type_test

def to_solr_property(prop, for_event=False):
	if dict_has_non_empty_member(prop.api_obj, "type"):
		content = to_solr_type_name(prop.api_obj["type"])
	else:
		content = ""

	if for_event is True:
		return {
			"content": prop.name + " " + content + " " + to_solr_description(prop.api_obj["summary"]),
			"name": prop.name
			}
	else:
		return {
			"id": prop.parent.name + "-property-" + prop.name,
			"name": prop.parent.name + "." + prop.name,
			"content": prop.parent.name + " " + prop.name + " " + content +
                " " + to_solr_description(prop.api_obj["summary"], prop) +
				" " + to_solr_remarks(prop) + " " + to_solr_examples(prop)
			}

def to_solr_properties(properties, for_event=False):
	return [to_solr_property(prop, for_event) for prop in properties]

def to_solr_return_types(return_types):
	if return_types is None or len(return_types) == 0:
		return "" 
	orig_types = return_types
	if not isinstance(orig_types, list):
		orig_types = [orig_types]
	return_types = ""
	for t in orig_types:
		if dict_has_non_empty_member(t, "summary"):
			return_types += " " + to_solr_type_name(t["type"]) + " " + to_solr_description(t["summary"])
		else:
			return_types += " " + to_solr_type_name(t["type"])
	return return_types

def to_solr_method_parameter(p):
	data_type = to_solr_type_name(p.api_obj["type"])
	if data_type.lower() == "object" and p.parent.name.startswith("create"):
		if "returns" in p.parent.api_obj:
			method_return_type = p.parent.api_obj["returns"]["type"]
			if method_return_type in all_annotated_apis:
				type_in_method_name = p.parent.name.replace("create", "")
				if len(type_in_method_name) > 0 and type_in_method_name == method_return_type.split(".")[-1]:
					data_type = to_solr_type_name(method_return_type)
	return data_type + " " + p.name + " " + to_solr_description(p.api_obj["summary"])

def to_solr_function(method):
	log.trace("%s.%s" % (method.parent.name, method.name))
	content = to_solr_description(method.api_obj["summary"], method) + " " + to_solr_remarks(method)

	if method.parameters is not None and len(method.parameters) > 0:
		for p in method.parameters:
			content += " " + to_solr_method_parameter(p)

	if dict_has_non_empty_member(method.api_obj, "returns") and method.api_obj["returns"] != "void":
		content += " " + to_solr_return_types(method.api_obj["returns"])

	content += " " + to_solr_examples(method)
	result = {
			"id": method.parent.name + "-method-" + method.name,
			"name": method.parent.name + "." + method.name,
			"content": method.parent.name + " " + method.name + " " + content
			}
	return result

def to_solr_functions(methods):
	return [to_solr_function(method) for method in methods]

def to_solr_event(event):
	content = to_solr_description(event.api_obj["summary"], event) + " " + to_solr_remarks(event)
	if event.properties is not None:
		properties = to_solr_properties(event.properties, for_event=True)
		for property in properties:
			if property is not None:
				content += " " + property["name"]+ " " + property["content"]
				
	return {
			"id": event.parent.name + "-event-" + event.name,
			"name": event.parent.name + "." + event.name,
			"content": event.parent.name + " " + event.name + " " + content
			}

def to_solr_events(events):
	return [to_solr_event(event) for event in events]

def to_solr_remarks(api):
	if dict_has_non_empty_member(api.api_obj, "description"):
		return api.api_obj["description"]
	else:
		return "" 

def to_solr_type(api):
	# Objects marked as external should be ignored
	if api.external:
		return None
	if api.name in not_real_titanium_types:
		return None
	log.trace("Converting %s to json" % api.name)
	content = to_solr_description(api.api_obj["summary"], api) + " " + to_solr_remarks(api) + to_solr_examples(api)

	result = [{
            "id": api.name,
			"name": api.name,
			"content": content
			}]

	if api.properties is not None:
		properties = to_solr_properties(api.properties)
		for property in properties:
			if property is not None:
				result.append(property)

	if api.methods is not None:
		methods = to_solr_functions(api.methods)
		for method in methods:
			if method is not None:
				result.append(method)

	if api.events is not None:
		events = to_solr_events(api.events)
		for event in events:
			if event is not None:
				result.append(event)

	return result

def generate(raw_apis, annotated_apis, options):
	global all_annotated_apis, log
	log_level = TiLogger.INFO
	if options.verbose:
		log_level = TiLogger.TRACE
	all_annotated_apis = annotated_apis
	log = TiLogger(None, level=log_level, output_stream=sys.stderr)
	log.info("Generating JSON for SOLR indexer")
	result = []

	for key in all_annotated_apis.keys():
		solr_type = to_solr_type(all_annotated_apis[key])
		if solr_type is not None:
			result = result + solr_type

	if options.stdout:
		json.dump(result, sys.stdout, sort_keys=False, indent=4)
	else:
		output_folder = None
		if options.output:
			output_folder = options.output
		else:
			dist_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "dist"))
			if os.path.exists(dist_dir):
				output_folder = os.path.join(dist_dir, "apidoc")
				if not os.path.exists(output_folder):
					os.mkdir(output_folder)
		if not output_folder:
			log.warn("No output folder specified and dist path does not exist.  Forcing output to stdout.")
			json.dump(result, sys.stdout, sort_keys=False, indent=4)
		else:
			output_file = os.path.join(output_folder, "api_solr.json")
			f = open(output_file, "w")
			json.dump(result, f, sort_keys=False, indent=4)
			f.close()
			log.info("%s written" % output_file)
