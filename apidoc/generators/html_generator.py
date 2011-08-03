#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
import os, sys, re

this_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))
module_support_dir = os.path.abspath(os.path.join(this_dir, "..", "support", "module", "support"))
if os.path.exists(module_support_dir):
	sys.path.append(module_support_dir)
import markdown # we package it under support/module/support
from common import info, err, warn, msg, dict_has_non_empty_member, vinfo
from common import VERBOSE, set_log_level

default_colorize_language = "javascript"
all_annotated_apis = None
ignore_for_inheritance_mention = ("Titanium.Proxy", "Titanium.Module", "Titanium.Event")
files_written = []

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
template_dir = os.path.abspath(os.path.join(this_dir, "..", "templates", "html"))
template_lookup = TemplateLookup(directories=[template_dir])

def generate(raw_apis, annotated_apis, options):
	if options.verbose:
		set_log_level(VERBOSE)
	global all_annotated_apis
	all_annotated_apis = annotated_apis
	if not hasattr(options, "output") or options.output is None or len(options.output) == 0:
		err("'output' option not provided")
		sys.exit(1)
	if not hasattr(options, "version") or options.version is None or len(options.version) == 0:
		err("'version' option not provided")
		sys.exit(1)
			
	if not os.path.exists(options.output):
		os.makedirs(options.output)

	# Add html-specific annotations. Do it twice because the
	# api objects can cross-reference each other.
	info("Annotating api objects with html-specific attributes")
	for x in range(2):
		for api in annotated_apis.values():
			if api.typestr in ("method", "property", "event"):
				vinfo ("html-annotating %s.%s" % (api.parent.name, api.name))
			elif api.typestr == "parameter":
				vinfo ("html-annotating %s.%s.%s" % (api.parent.parent.name,
					api.parent.name, api.name))
			else:
				vinfo("html-annotating %s" % api.name)
			annotate(api)

	# Write the output files
	info("Creating html files in %s" % options.output)
	for name in annotated_apis:
		one_type = annotated_apis[name]
		vinfo("Producing html output for %s" % name)
		render_template(one_type, options)
		if hasattr(one_type, "methods"):
			for m in one_type.methods:
				vinfo("Producing html output for %s.%s" % (name, m.name))
				render_template(m, options)

# Annotations specific to this output format
def annotate(annotated_obj):
	setattr(annotated_obj, "description_html", "")
	setattr(annotated_obj, "notes_html", "")
	setattr(annotated_obj, "examples_html", [])
	setattr(annotated_obj, "inherited_from_obj", None)
	if dict_has_non_empty_member(annotated_obj.api_obj, "description"):
		desc = annotated_obj.api_obj["description"]
		annotated_obj.description_html = markdown_to_html(desc, obj=annotated_obj)
	if dict_has_non_empty_member(annotated_obj.api_obj, "notes"):
		annotated_obj.notes_html = markdown_to_html(annotated_obj.api_obj["notes"], obj=annotated_obj)
	if dict_has_non_empty_member(annotated_obj.api_obj, "examples"):
		for example in annotated_obj.api_obj["examples"]:
			one_example = {"title": "", "example": ""}
			if dict_has_non_empty_member(example, "title"):
				one_example["title"] = example["title"]
			if dict_has_non_empty_member(example, "example"):
				html_example = markdown_to_html(example["example"], obj=annotated_obj)
				# Suspicious if the example has content (beyond the <p></p>) but not <code>.
				# This can happen if in the .yml the example starts off immediately with code,
				# because the yaml parser interprets the leading four spaces (which the programmer
				# put in there to tip off markdown that it's a code block) as indentatioin.
				if len(html_example) > len("<p></p>") and "<code>" not in html_example:
					html_example = "<pre><code>%s</code></pre>" % html_example
				one_example["example"] = html_example
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
	if annotated_obj.typestr in ("proxy"):
		setattr(annotated_obj, "filename_html", "%s-object" % annotated_obj.name)
	if hasattr(annotated_obj, "inherited_from") and len(annotated_obj.inherited_from) > 0:
		if annotated_obj.inherited_from in all_annotated_apis:
			annotated_obj.inherited_from_obj = all_annotated_apis[annotated_obj.inherited_from]
	for list_type in ("methods", "properties", "events", "parameters"):
		annotate_member_list(annotated_obj, list_type)
	if hasattr(annotated_obj, "methods"):
		set_overloaded_method_filenames(annotated_obj)

def annotate_member_list(annotated_obj, member_list_name):
	if hasattr(annotated_obj, member_list_name) and len(getattr(annotated_obj, member_list_name)) > 0:
		for m in getattr(annotated_obj, member_list_name):
			annotate(m)

def set_overloaded_method_filenames(obj):
	filenames = []
	for m in obj.methods:
		counter = 1
		test_filename = m.filename_html
		while test_filename in filenames:
			test_filename = "%s-%s" % (m.filename_html, counter)
			counter += 1
		m.filename_html = test_filename
		filenames.append(test_filename)

def render_template(annotated_obj, options):
	global files_written
	template = None
	if template_cache.has_key(annotated_obj.template_html):
		template = template_cache[annotated_obj.template_html]
	else:
		template_file = os.path.join(template_dir, "%s.html" % annotated_obj.template_html)
		template = template_lookup.get_template("%s.html" % annotated_obj.template_html)
		template_cache[annotated_obj.template_html] = template
	output = template.render(config=options, data=annotated_obj)
	base_filename = annotated_obj.filename_html
	if base_filename in files_written:
		warn("File %s.html has already been written. Duplicate type?" % base_filename)
	else:
		files_written.append(base_filename)
	full_filename = os.path.join(options.output, "%s.html" % base_filename)
	f = open(full_filename,"w+")
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

def anchor_for_object_or_method(obj_specifier, text=None, language="markdown"):
	if language == "markdown":
		label = text or ("`%s`" % obj_specifier)
		template = "[%s](#)" % label
	else:
		label = text or ("<code>%s</code>" % obj_specifier)
		template = '<a href="#">%s</a>' % label
	if obj_specifier in all_annotated_apis:
		obj = all_annotated_apis[obj_specifier]
		if hasattr(obj, "filename_html"):
			return template.replace("#", "%s.html" % obj.filename_html), True
	else:
		# Maybe a method
		parts = obj_specifier.split(".")
		if len(parts) > 0:
			parent = ".".join(parts[:-1])
			method_name = parts[-1]
			if parent in all_annotated_apis:
				obj = all_annotated_apis[parent]
				if hasattr(obj, "methods"):
					for m in obj.methods:
						if m.name == method_name and hasattr(m, "filename_html"):
							return template.replace("#", "%s.html" % m.filename_html), True
	# Didn't find it. At least return code-styled specifier
	if language == "markdown":
		return "`%s`" % obj_specifier, False
	else:
		return "<code>%s</code>" % obj_specifier, False

def replace_with_link(full_string, link_info):
	s = full_string
	obj_specifier = link_info
	if obj_specifier.startswith("<"):
		obj_specifier = obj_specifier[1:-1]
		anchor, found_type = anchor_for_object_or_method(obj_specifier)
		return s.replace(link_info, anchor)

	pattern = r"\[([^\]]+)\]\(([^\)]+)\)"
	prog = re.compile(pattern)
	match = prog.match(link_info)
	if match:
		anchor, found_type = anchor_for_object_or_method(match.groups()[1], text=match.groups()[0])
		if found_type:
			return s.replace(link_info, anchor)
	# fallback
	return s

def process_markdown_links(s):
	new_string = s
	patterns = (r"(\[[^\]]+\]\([^\)]+\))", r"(\<[^\>]+\>)")
	for pattern in patterns:
		prog = re.compile(pattern, re.MULTILINE)
		results = prog.findall(new_string)
		if results is not None and len(results) > 0:
			for r in results:
				new_string = replace_with_link(new_string, r)
	return new_string

def markdown_to_html(s, obj=None):
	if s is None or len(s) == 0:
		return ""
	if s.startswith("file:") and obj is not None:
		return markdown_to_html(load_file_markdown(s, obj))
	if "<" in s or "[" in s:
		s = process_markdown_links(s)
	return markdown.markdown(s)

def data_type_to_html(type_spec):
	result = ""
	type_specs = []
	pattern = r"(Dictionary|Array|Callback)\<([^\>]+)\>"
	link_placeholder = "||link here||"
	if hasattr(type_spec, "append"):
		type_specs = type_spec
	else:
		type_specs = [type_spec]
	for one_spec in type_specs:
		if type(one_spec) is dict:
			one_type = one_spec["type"]
		else:
			one_type = one_spec
		one_type = one_type.strip()
		one_type_html = one_type
		if one_type in all_annotated_apis:
			one_type_html, found_type = anchor_for_object_or_method(one_type, language="html")
		elif "." in one_type and ".".join(one_type.split(".")[:-1]) in all_annotated_apis:
			one_type_html, found_type = anchor_for_object_or_method(one_type, language="html")
		else:
			match = re.match(pattern, one_type)
			if match is None or match.groups() is None or len(match.groups()) != 2:
				one_type_html = one_type_html.replace("<", "&lt;").replace(">", "&gt;")
			else:
				raw_type = match.groups()[1]
				type_link, found_type = anchor_for_object_or_method(raw_type, language="html")
				one_type_html = one_type_html.replace("<%s>" % raw_type, link_placeholder)
				one_type_html = one_type_html.replace("<", "&lt;").replace(">", "&gt;")
				one_type_html = one_type_html.replace(link_placeholder, "<%s>" % type_link)
		if len(result) > 0:
			result += " or "
		result += one_type_html
	return result

