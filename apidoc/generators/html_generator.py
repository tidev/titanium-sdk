#!/usr/bin/env python
#
# Copyright (c) 2012 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
import os, sys, re, codecs

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from common import dict_has_non_empty_member, strip_tags, not_real_titanium_types

# We package simplejson, markdown and mako in support/common.
common_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "common"))
sys.path.append(common_support_dir)
import markdown
from mako.template import Template
from mako.lookup import TemplateLookup

# TiLogger is in support/android
android_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "android"))
sys.path.append(android_support_dir)
from tilogger import *
log = None

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

try:
	import json
except:
	import simplejson as json

default_colorize_language = "javascript"
all_annotated_apis = None
files_written = []
template_cache = {} # cache templates so we don't need to load them each time
template_dir = os.path.abspath(os.path.join(this_dir, "..", "templates", "html"))
template_lookup = TemplateLookup(directories=[template_dir])
current_api = None # The api currently being annotated; useful for appending to log statements.
current_annotation_pass = -1 # during generate() will be in range of 0 to 1 (we have 2 passes for annotation.)

def generate(raw_apis, annotated_apis, options):
	log_level = TiLogger.INFO
	if not options is None and options.verbose:
		log_level = TiLogger.TRACE
	global all_annotated_apis, log, current_api, current_annotation_pass
	all_annotated_apis = annotated_apis
	log = TiLogger(None, level=log_level, output_stream=sys.stderr)
	if options is not None and (not hasattr(options, "output") or options.output is None or len(options.output) == 0):
		log.warn("'output' option not provided")
	if options is not None and (not hasattr(options, "version") or options.version is None or len(options.version) == 0):
		log.error("'version' option not provided")
		sys.exit(1)
			
	if options is not None and not os.path.exists(options.output):
		os.makedirs(options.output)

	# Add html-specific annotations. Do it twice because the
	# api objects can cross-reference each other.
	log.info("Annotating api objects with html-specific attributes")

	current_api = None
	for current_annotation_pass in range(2):
		for api in annotated_apis.values():
			if api.typestr in ("method", "property", "event"):
				current_api = "%s.%s" % (api.parent.name, api.name)
			elif api.typestr == "parameter":
				current_api = "%s.%s.%s" % (api.parent.parent.name,
					api.parent.name, api.name)
			else:
				current_api = api.name
			log.trace("html-annotating %s" % current_api)
			annotate(api)

	current_annotation_pass = -1
	current_api = None

	# Write the output files
	if options is not None:
		log.info("Creating html files in %s" % options.output)
		for name in annotated_apis:
			one_type = annotated_apis[name]
			log.trace("Producing html output for %s" % name)
			render_template(one_type, options)
			member_types = ("methods", "properties", "events")
			for mt in member_types:
				if hasattr(one_type, mt):
					for m in getattr(one_type, mt):
						log.trace("Producing html output for %s.%s" % (name, m.name))
						render_template(m, options)

		# Create the special .json files that the webserver uses.
		log.info("Creating json files for server")
		stats = {
			'modules':0,
			'objects':0,
			'properties':0,
			'methods':0
		}
		search_json = []
		module_names = []
		for api in all_annotated_apis.values():
			if api.name in not_real_titanium_types or not api.name.startswith("Titanium"):
				continue
			search_item = {"filename": api.name,
					"type": "module" if api.typestr == "module" else "object",
					"content": content_for_search_index(api)}
			search_json.append(search_item)
			if api.typestr == "module":
				module_names.append(api.name)
				stats["modules"] += 1
				toc = {}
				toc["methods"] = [m.name for m in api.methods]
				toc["objects"] = [p.name.split(".")[-1] for p in api.member_proxies]
				toc["properties"] = [p.name for p in api.properties]
				for l in toc.values():
					l.sort()
				json_to_file(toc, os.path.join(options.output, "toc_%s.json" % api.name))
			else:
				stats["objects"] += 1
			stats["methods"] += len(api.methods)
			stats["properties"] += len(api.properties)
		module_names.sort()
		json_to_file(module_names, os.path.join(options.output, "toc.json"))
		json_to_file(search_json, os.path.join(options.output, "search.json"))
		json_to_file(stats, os.path.join(options.output, "stats.json"))
		# Generate an index.html, mostly for developers who run docgen and want
		# to see a table of modules.
		index_template = template_lookup.get_template("index.html")
		index_output = index_template.render(config=options, data=all_annotated_apis)
		index_file = open(os.path.join(options.output, "index.html"), "w")
		index_file.write(index_output)
		index_file.close()
		log.info("An index.html file has been written to %s and contains links to all modules." % os.path.abspath(options.output))

		changelog_mdoc = os.path.abspath(os.path.join(this_dir, "..", "Titanium", "CHANGELOG", "%s.mdoc" % options.version))
		if not os.path.exists(changelog_mdoc):
			log.warn("%s wasn't found, skipping changelog.html generation." % changelog_mdoc)
		else:
			changelog = codecs.open(changelog_mdoc, "r", "utf8").read()
			out = codecs.open(os.path.join(options.output, "changelog.html"), "w+", "utf8")
			out.write(markdown.markdown(changelog))
			out.close()

def content_for_search_index(annotated_obj):
	contents = []
	contents.append(annotated_obj.name)
	contents.append(" ".join(annotated_obj.name.split('.')))
	contents.append(annotated_obj.summary_html)
	contents.extend([e.name for e in annotated_obj.events])
	contents.extend([m.name for m in annotated_obj.methods])
	contents.extend([p.name for p in annotated_obj.properties])
	contents.extend([e["title"] for e in annotated_obj.examples_html])
	if len(annotated_obj.description_html) > 0:
		contents.append(annotated_obj.description_html)
	return strip_tags(" ".join(contents))

def json_to_file(obj, filename):
	out = open(filename, "w+")
	out.write(json.dumps(obj, indent=4))
	out.close()

# Annotations specific to this output format
def annotate(annotated_obj):
	annotated_obj.summary_html = ""
	annotated_obj.description_html = ""
	annotated_obj.examples_html = []
	annotated_obj.inherited_from_obj = None
	if hasattr(annotated_obj, "inherited_from") and len(annotated_obj.inherited_from) > 0:
		if annotated_obj.inherited_from in all_annotated_apis:
			annotated_obj.inherited_from_obj = all_annotated_apis[annotated_obj.inherited_from]
	is_inherited = (annotated_obj.inherited_from_obj is not None)
	if annotated_obj.deprecated:
		if "notes" in annotated_obj.deprecated:
			annotated_obj.deprecated["notes_html"] = markdown_to_html(
					annotated_obj.deprecated["notes"],
					obj=annotated_obj,
					suppress_link_warnings=is_inherited,
					strip_outer_paragraph=True)
	if dict_has_non_empty_member(annotated_obj.api_obj, "summary"):
		summary = annotated_obj.api_obj["summary"]
		annotated_obj.summary_html = markdown_to_html(summary, obj=annotated_obj, suppress_link_warnings=is_inherited)
	if dict_has_non_empty_member(annotated_obj.api_obj, "description"):
		annotated_obj.description_html = markdown_to_html(annotated_obj.api_obj["description"], obj=annotated_obj, suppress_link_warnings=is_inherited)
	if dict_has_non_empty_member(annotated_obj.api_obj, "examples"):
		for example in annotated_obj.api_obj["examples"]:
			one_example = {"title": "", "example": ""}
			if dict_has_non_empty_member(example, "title"):
				one_example["title"] = example["title"]
			if dict_has_non_empty_member(example, "example"):
				html_example = markdown_to_html(example["example"], obj=annotated_obj, suppress_link_warnings=is_inherited)
				# Suspicious if the example has content (beyond the <p></p>) but not <code>.
				# This can happen if in the .yml the example starts off immediately with code,
				# because the yaml parser interprets the leading four spaces (which the programmer
				# put in there to tip off markdown that it's a code block) as indentation.
				if len(html_example) > len("<p></p>") and "<code>" not in html_example:
					html_example = "<pre><code>%s</code></pre>" % html_example
				one_example["example"] = html_example
			annotated_obj.examples_html.append(one_example)
	if annotated_obj.typestr in ("parameter", "property"):
		annotated_obj.type_html = ""
		if dict_has_non_empty_member(annotated_obj.api_obj, "type"):
			annotated_obj.type_html = data_type_to_html(annotated_obj.api_obj["type"])
	if annotated_obj.typestr == "method":
		annotated_obj.return_type_html = ""
		if dict_has_non_empty_member(annotated_obj.api_obj, "returns"):
			annotated_obj.return_type_html = data_type_to_html(annotated_obj.api_obj["returns"])
		annotated_obj.template_html = "method"
		annotated_obj.filename_html = clean_for_filename("%s.%s-%s" % (annotated_obj.parent.name, annotated_obj.name, "method"))
	if annotated_obj.typestr in ("proxy", "module"):
		annotated_obj.template_html = "proxy"
	if annotated_obj.typestr == "module":
		annotated_obj.filename_html = clean_for_filename("%s-module" % annotated_obj.name)
	if annotated_obj.typestr == "proxy":
		annotated_obj.filename_html = clean_for_filename("%s-object" % annotated_obj.name)
	if annotated_obj.typestr == "property":
		annotated_obj.filename_html = clean_for_filename("%s.%s-%s" % (annotated_obj.parent.name, annotated_obj.name, "property"))
		annotated_obj.template_html = "property"
		if annotated_obj.default is not None:
			annotated_obj.default_html = markdown_to_html(str(annotated_obj.default), suppress_link_warnings=is_inherited)
	# Override for "property" that is an event callback property
	if annotated_obj.typestr == "property" and annotated_obj.parent.typestr == "event":
		annotated_obj.filename_html = clean_for_filename("%s.%s.%s-%s" % (annotated_obj.parent.parent.name, annotated_obj.parent.name, annotated_obj.name, "callback-property"))
		annotated_obj.template_html = "property"
	if annotated_obj.typestr == "parameter":
		annotated_obj.filename_html = clean_for_filename("%s.%s-param" % (annotated_obj.parent.filename_html, annotated_obj.name))
		annotated_obj.template_html = "property"
		if annotated_obj.default is not None:
			annotated_obj.default_html = markdown_to_html(str(annotated_obj.default), suppress_link_warnings=is_inherited)
	if annotated_obj.typestr == "event":
		annotated_obj.filename_html = clean_for_filename("%s.%s-%s" % (annotated_obj.parent.name, annotated_obj.name, "event"))
		annotated_obj.template_html = "event"
	for list_type in ("methods", "properties", "events", "parameters"):
		annotate_member_list(annotated_obj, list_type)

def annotate_member_list(annotated_obj, member_list_name):
	if hasattr(annotated_obj, member_list_name) and len(getattr(annotated_obj, member_list_name)) > 0:
		for m in getattr(annotated_obj, member_list_name):
			annotate(m)
		if member_list_name == "methods":
			set_overloaded_method_filenames(annotated_obj)

def set_overloaded_method_filenames(obj):
	filenames = []
	for m in obj.methods:
		counter = 1
		test_filename = m.filename_html
		while test_filename in filenames:
			test_filename = "%s-%s" % (m.filename_html, counter)
			counter += 1
		changed = (m.filename_html != test_filename)
		m.filename_html = test_filename
		filenames.append(test_filename)
		if changed:
			# Change parameter filenames too
			if m.parameters:
				for p in m.parameters:
					p.filename_html = clean_for_filename("%s.%s-param" % (m.filename_html, p.name))

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
		log.warn("File %s.html has already been written. Duplicate type?" % base_filename)
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

def anchor_for_object_or_member(obj_specifier, text=None, language="markdown", suppress_code_formatting=False):
	fragment = ""
	obj_specifier_base = obj_specifier
	if obj_specifier_base.startswith("Ti."):
		obj_specifier_base = "Titanium.%s" % obj_specifier_base[3:]
	fragment_start = obj_specifier.rfind("#")
	if fragment_start >= 0:
		fragment = obj_specifier[fragment_start:]
		if fragment_start > 0:
			obj_specifier_base = obj_specifier[0:fragment_start]
		elif fragment_start == 0:
			obj_specifier_base = ""

	if language == "markdown":
		if not suppress_code_formatting:
			label = text or ("`%s`" % obj_specifier)
		else:
			label = text or obj_specifier
		template = "[%s](<address_here>)" % label
	else:
		if not suppress_code_formatting:
			label = text or ("<code>%s</code>" % obj_specifier)
		else:
			label = text or (obj_specifier)
		template = '<a href="<address_here>">%s</a>' % label

	identifier_exists = (obj_specifier_base in all_annotated_apis)
	if identifier_exists:
		obj = all_annotated_apis[obj_specifier_base]
		if hasattr(obj, "filename_html"):
			url = "%s.html" % obj.filename_html
			if fragment:
				url += fragment
			return (template.replace("<address_here>", url), True)
	else:
		# Maybe a method, property or event
		parts = obj_specifier_base.split(".")
		if len(parts) > 0:
			parent = ".".join(parts[:-1])
			member_name = parts[-1]
			if parent in all_annotated_apis:
				obj = all_annotated_apis[parent]
				list_names = ("methods", "properties", "events")
				for list_name in list_names:
					if hasattr(obj, list_name) and type(getattr(obj, list_name)) == list:
						for m in getattr(obj, list_name):
							if m.name == member_name:
								identifier_exists = True
								if hasattr(m, "filename_html"):
									url = "%s.html" % m.filename_html
									if fragment:
										url += fragment
									return (template.replace("<address_here>", url), True)

	# Didn't find it (or its filename_html isn't ready yet because we're in the first annotation pass.
	# At least send it back styled like code (unless that's suppressed).
	if language == "markdown":
		if not suppress_code_formatting:
			return "`%s`" % obj_specifier, identifier_exists
		else:
			return obj_specifier, identifier_exists
	else:
		if not suppress_code_formatting:
			return "<code>%s</code>" % obj_specifier, identifier_exists
		else:
			return obj_specifier, identifier_exists

def replace_with_link(full_string, link_info, suppress_warnings=False):
	def should_warn(anchor):
		# strip out any backticks we threw in their already
		test = anchor.replace("`", "")
		if suppress_warnings or current_annotation_pass == 0:
			return False
		if "http://" in test or "https://" in test:
			return False

		# If it "looks like" an html tag -- all lower case, no spaces, starts with < ends with > -- then
		# don't warn.
		closing_tag = r"/\w+"
		if re.match(closing_tag, test):
			return False
		# Now for a weak check of a start tag. If characters, then only lower-case.
		start_tag = r"[a-z]+"
		if re.match(start_tag, test):
			return False
		return True

	s = full_string
	obj_specifier = link_info
	if obj_specifier.startswith("<"):
		obj_specifier = obj_specifier[1:-1]
		anchor, found_type = anchor_for_object_or_member(obj_specifier)
		if found_type:
			return s.replace(link_info, anchor)
		else:
			if should_warn(anchor):
				log.warn("While processing %s: link %s could not be resolved" % (current_api, link_info))
			# if it at least looks like a Titanium type (but perhaps one
			# that is not documented), return the styled result from anchor_for_object_or_member.
			if obj_specifier.startswith("Ti") and "." in obj_specifier and not " " in obj_specifier:
				return s.replace(link_info, anchor)

	pattern = r"\[([^\]]+)\]\(([^\)\s]+)\)"
	prog = re.compile(pattern)
	match = prog.match(link_info)
	if match:
		anchor, found_type = anchor_for_object_or_member(match.groups()[1], text=match.groups()[0])
		if found_type:
			return s.replace(link_info, anchor)
		else:
			if should_warn(anchor):
				log.warn("While processing %s: link %s could not be resolved" % (current_api, link_info))
	# fallback
	return s

def process_markdown_links(s, suppress_link_warnings=False):
	new_string = s
	patterns = (r"(\[[^\]]+\]\([^\)\s]+\))", r"(\<[^\>\s]+\>)")
	for pattern in patterns:
		prog = re.compile(pattern, re.MULTILINE)
		results = prog.findall(new_string)
		if results is not None and len(results) > 0:
			for r in results:
				new_string = replace_with_link(new_string, r, suppress_warnings=suppress_link_warnings)
	return new_string

def markdown_to_html(s, obj=None, suppress_link_warnings=False, strip_outer_paragraph=False):
	if s is None or len(s) == 0:
		return ""
	if s.startswith("file:") and obj is not None:
		return markdown_to_html(load_file_markdown(s, obj))
	if "<" in s or "[" in s:
		s = process_markdown_links(s, suppress_link_warnings=suppress_link_warnings)
	s = markdown.markdown(s)
	if strip_outer_paragraph:
		if s.lower()[0:3] == "<p>":
			s = s[3:]
		if s.lower()[-4:] == "</p>":
			s = s[:-4]

	return s

def data_type_to_html(type_spec):
	result = ""
	type_specs = []
	pattern = r"(Dictionary|Array|Callback)(\<.+\>)"
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
			one_type_html, found_type = anchor_for_object_or_member(one_type, language="html")
		elif "." in one_type and ".".join(one_type.split(".")[:-1]) in all_annotated_apis:
			one_type_html, found_type = anchor_for_object_or_member(one_type, language="html")
		else:
			one_type_html = ""
			parts = []
			match = re.match(pattern, one_type)
			if match is None:
				parts.append(one_type)
			else:
				while match is not None and match.groups() is not None and len(match.groups()) == 2:
					parts.append(match.groups()[0])
					new_search = match.groups()[1][1:-1]
					match = re.match(pattern, new_search)
					if match is None:
						parts.append(new_search)

			for i in range(0, len(parts)):
				p = parts[i]
				html_link, found = anchor_for_object_or_member(p, language="html")

				# We don't make it look code-like if it's just String or Object,
				# or if it's Array/Dictionary/Callback
				if (not found and i==0) or (p in ("Array", "Callback", "Dictionary")):
					html_link = html_link.replace("<code>", "").replace("</code>", "")

				one_type_html += html_link

				if i != len(parts) - 1:
					one_type_html += "&lt;"

			if len(parts) > 1:
				one_type_html += ("&gt;" * (len(parts) - 1))

		if len(result) > 0:
			result += " or "
		result += one_type_html

	return result

def clean_for_filename(s):
	return s.replace(":", "-").replace("/", "-")
