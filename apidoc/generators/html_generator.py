#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
import os, sys

this_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.abspath(os.path.join(this_dir, '..')))
module_support_dir = os.path.abspath(os.path.join(this_dir, '..', 'support', 'module', 'support'))
if os.path.exists(module_support_dir):
	sys.path.append(module_support_dir)
import markdown # we package it under support/module/support
from common import info, err, warn, msg, dict_has_non_empty_member

default_colorize_language = "javascript"

try:
	from mako.template import Template
	from mako.lookup import TemplateLookup
except:
	msg("You don't have mako!\n")
	msg("You can install it with:\n")
	msg(">  easy_install Mako")
	msg("")
	sys.exit(1)

try:
	from pygments import highlight
	from pygments.formatters import HtmlFormatter
	from pygments.lexers import get_lexer_by_name
except:
	msg("You don't have Pygments!\n")
	msg("You can install it with:\n")
	msg(">  easy_install Pygments")
	msg("")
	sys.exit(1)

template_cache = {} # cache templates so we don't need to load them each time
template_dir = os.path.abspath(os.path.join(this_dir, '..', 'templates', 'html'))
template_lookup = TemplateLookup(directories=[template_dir])

def generate(raw_apis, annotated_apis, options):
	if not hasattr(options, "output") or options.output is None or len(options.output) == 0:
		err("'output' option not provided")
		sys.exit(1)
	if not hasattr(options, "version") or options.version is None or len(options.version) == 0:
		err("'version' option not provided")
		sys.exit(1)
			
	if not os.path.exists(options.output):
		os.makedirs(options.output)

	# Add html-specific annotations
	for api in annotated_apis.values():
		annotate(api, annotated_apis)
		
	for name in annotated_apis:
		if not name.startswith("Titanium"):
			continue
		one_type = annotated_apis[name]
		info("Producing html output for %s" % name)
		render_template(one_type, annotated_apis, options)
		if hasattr(one_type, "methods"):
			for m in one_type.methods:
				info("Producing html output for %s.%s" % (name, m.name))
				render_template(m, annotated_apis, options)

# Annotations specific to this output format
def annotate(annotated_obj, all_annotated_objects):
	if annotated_obj.is_annotated_for_format("html"):
		return
	setattr(annotated_obj, "description_html", "")
	setattr(annotated_obj, "notes_html", "")
	setattr(annotated_obj, "examples_html", [])
	if dict_has_non_empty_member(annotated_obj.api_obj, "description"):
		setattr(annotated_obj, "description_html", markdown_to_html(annotated_obj.api_obj["description"], obj=annotated_obj))
	if dict_has_non_empty_member(annotated_obj.api_obj, "notes"):
		annotated_obj.notes_html = markdown_to_html(annotated_obj.api_obj["notes"], obj=annotated_obj)
	if dict_has_non_empty_member(annotated_obj.api_obj, "examples"):
		for example in annotated_obj.api_obj["examples"]:
			one_example = {"title": "", "example": ""}
			if dict_has_non_empty_member(example, "title"):
				one_example["title"] = example["title"]
			if dict_has_non_empty_member(example, "example"):
				one_example["example"] = markdown_to_html(example["example"], obj=annotated_obj)
			annotated_obj.examples_html.append(one_example)
	if annotated_obj.typestr in ("parameter", "property"):
		setattr(annotated_obj, "type_html", "")
		if dict_has_non_empty_member(annotated_obj.api_obj, "type"):
			annotated_obj.type_html = data_type_to_html(annotated_obj.api_obj["type"])
	if annotated_obj.typestr == "method":
		setattr(annotated_obj, "return_type_html", "")
		if dict_has_non_empty_member(annotated_obj.api_obj, "returns"):
			annotated_obj.return_type_html = data_type_to_html(annotated_obj.api_obj["returns"])
		setattr(annotated_obj, "template_html", "method")
		setattr(annotated_obj, "filename_html", "%s.%s-%s" % (annotated_obj.parent.name, annotated_obj.name, "method"))
	if annotated_obj.typestr in ("proxy", "module"):
		setattr(annotated_obj, "template_html", "proxy")
	if annotated_obj.typestr == "module":
		setattr(annotated_obj, "filename_html", "%s-module" % annotated_obj.name)
	if annotated_obj.typestr == "proxy":
		setattr(annotated_obj, "filename_html", "%s-object" % annotated_obj.name)
	for list_type in ("methods", "properties", "events", "parameters"):
		annotate_member_list(annotated_obj, list_type, all_annotated_objects)
	annotated_obj.set_annotation_complete("html")

def annotate_member_list(annotated_obj, member_list_name, all_annotated_objects):
	if hasattr(annotated_obj, member_list_name) and len(getattr(annotated_obj, member_list_name)) > 0:
		for m in getattr(annotated_obj, member_list_name):
			annotate(m, all_annotated_objects)

def render_template(annotated_obj, all_annotated_objects, options):
	annotate(annotated_obj, all_annotated_objects)
	template = None
	if template_cache.has_key(annotated_obj.template_html):
		template = template_cache[annotated_obj.template_html]
	else:
		template_file = os.path.join(template_dir, "%s.html" % annotated_obj.template_html)
		template = template_lookup.get_template("%s.html" % annotated_obj.template_html)
		template_cache[annotated_obj.template_html] = template
	output = template.render(config=options, data=annotated_obj)
	filename = os.path.join(options.output,'%s.html' % annotated_obj.filename_html)
	f = open(filename,'w+')
	if options.css is not None:
		f.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"%s\">\n" % options.css)
	if options.colorize:
		f.write(colorize_code(output))
	else:
		f.write(output)
	f.close()
	
def colorize_code(line):
	idx = line.find("<code>")
	if idx == -1:
		return line
	idx2 = line.find("</code>",idx)
	code = line[idx+6:idx2]
	# TODO: we need a way to override the source code language
	# Using guess_lexer doesn't seem to be consistent
	lexer = get_lexer_by_name(default_colorize_language)
	formatter = HtmlFormatter()
	result = highlight(code, lexer, formatter)
	before = line[0:idx]
	after = line[idx2+7:]
	content = before + result + after
	return colorize_code(content)

def load_file_markdown(file_specifier, obj):
	if obj is None or not hasattr(obj, "yaml_source_folder"):
		return ""
	filename = file_specifier.strip()[len("file:"):].strip()
	if len(filename) == 0:
		return ""
	filename = os.path.join(obj.yaml_source_folder, filename)
	if not os.path.exists(filename):
		return ""
	else:
		return open(filename, "r").read()

def markdown_to_html(s, obj=None):
	if s is None or len(s) == 0:
		return ""
	if s.startswith("file:") and obj is not None:
		return markdown_to_html(load_file_markdown(s, obj))
	return markdown.markdown(s)

def data_type_to_html(type_spec):
	# TODO lots of stuff like link to types, resolve Dictionary<>, etc.
	result = ""
	type_specs = []
	if hasattr(type_spec, "append"):
		type_specs = type_spec
	else:
		type_specs = [type_spec]
	for one_spec in type_specs:
		if type(one_spec) is dict:
			one_type = one_spec["type"]
		else:
			one_type = one_spec
		if len(result) > 0:
			result += " or "
		result += one_type
	return result.replace("<", "&lt;").replace(">", "&gt;")

