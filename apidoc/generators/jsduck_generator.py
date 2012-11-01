#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)

import os, sys, re

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from common import dict_has_non_empty_member

# We package the python markdown module already in /support/module/support/markdown.
module_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "module", "support"))
sys.path.append(module_support_dir)
import markdown

android_support_dir = os.path.abspath(os.path.join(this_dir, "..", "..", "support", "android"))
sys.path.append(android_support_dir)
from tilogger import *
log = TiLogger(None)

all_annotated_apis = None
apis = None

# Avoid obliterating our four spaces pattern with a careless %s:/    /^I/
FOUR_SPACES='  ' + '  '
# compiling REs ahead of time, since we use them heavily.
link_parts_re = re.compile(r"(?:\[([^\]]+?)\]\(([^\)\s]+?)\)|\<([^\>\s]+)\>)", re.MULTILINE)
find_links_re = re.compile(r"(\[[^\]]+?\]\([^\)\s]+?\)|\<[^\>\s]+\>)", re.MULTILINE)
html_scheme_re = re.compile(r"^http:|^https:")
doc_site_url_re = re.compile(r"http://docs.appcelerator.com/titanium/.*(#!.*)")
# we use this to distinguish inline HTML tags from Markdown links. Not foolproof, and a
# we should probably find a better technique in the long run.
html_element_re = re.compile("([a-z]|\/)")

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

# write unicode strings safely
def write_utf8(file, string):
    file.write(string.encode('utf8', 'replace'))

def convert_string_to_jsduck_link(obj_specifier):
	global all_annotated_apis
	if obj_specifier in all_annotated_apis:
		return obj_specifier
	else:
		# Maybe a method, property or event
		parts = obj_specifier.split(".")
		if len(parts) > 1:
			parent = ".".join(parts[:-1])
			member_name = parts[-1]
			if parent in all_annotated_apis:
				obj = all_annotated_apis[parent]
				list_names = {
					"methods": 'method-',
					"properties": 'property-',
					"events": 'event-'
				}
				for list_name in list_names.keys():
					if hasattr(obj, list_name) and type(getattr(obj, list_name)) == list:
						for m in getattr(obj, list_name):
							if m.name == member_name:
								return parent + '#' + list_names[list_name] + member_name
		else:
			return "#" + obj_specifier
	return obj_specifier

def process_markdown_links(s):
	new_string = s
	results = find_links_re.findall(new_string)
	if results is not None and len(results) > 0:
		for link in results:
			match = link_parts_re.match(link)
			if match == None:
				print "no match:" + link
				continue
			
			# Process links with a defined name [foo](url)
			if match.group(1) != None and match.group(2)!= None:
				url = match.group(2)
				name = match.group(1)
			# For simple markdown links, such as <Titanium.Analytics> or <www.google.com>
			# skip links that look like HTML elements (<span>).
			elif  match.group(3) != None and not html_element_re.match(link, 1):
				url = match.group(3)
				name = None
			# Otherwise, our "link" was probably an HTML tag, so we leave it alone
			else:
				continue

			# Process URLs
			docs_site_link = False
			api_link = False
			# For links back to the doc site -- guides pages, videos, etc.
			# extract just the part following the hash, to avoid re-loading the site
			# [Quick Start](http://docs.appcelerator.com/titanium/2.1/index.html#!/guide/Quick_Start) ->
			# [Quick Start](#!/guide/Quick_Start Quick Start)
			#
			# Generic absolute URLs pass through unchanged
			# [Facebook Graph API](http://developers.facebook.com/docs/reference/api/)  -> unchanged
			if url.startswith("http"):
				url_match = doc_site_url_re.match(url)
				if url_match:
						url = url_match.group(1)
						docs_site_link = True
						if not name:
							name = url
						new_string = new_string.replace(link, "[%s](%s)" % (name, url))
			else:
				# Reformat API object links so jsduck can process them.
				# [systemId](Titanium.XML.Entity.systemId -> {@link Titanium.XML.Entity#systemId systemId}
				url = convert_string_to_jsduck_link(url)
				if name:
					new_string = new_string.replace(link, "{@link %s %s}" % (url, name))
				else:
					new_string = new_string.replace(link, "{@link %s}" % url)

	return new_string

def markdown_to_html(s, obj=None):
	if s is None or len(s) == 0:
		return ""
	if "<" in s or "[" in s:
		s = process_markdown_links(s)
	return markdown.markdown(s)

# remove <p> and </p> if a string is enclosed with them
def remove_p_tags(str):
    if str is None or len(str) == 0:
        return ""
    if str.startswith("<p>"):
        str = str[3:]
    if str.endswith("</p>"):
        str = str[:-4]
    return str

# Print two digit version if third digit is 0.
def format_version(version_str):
	digits = version_str.split(".")
	if len(digits) <= 2:
		return version_str
	else:
		if digits[2] == '0':
			return ".".join(digits[0:2])
		else:
			return ".".join(digits)

def output_properties_for_obj(annotated_obj):
	obj = annotated_obj.api_obj
	res = []
	# Only output platforms if platforms or since versions are different from
	# containing object.
	if obj.has_key("platforms") or obj.has_key("since"):
		for platform in annotated_obj.platforms:
			res.append("@platform %s %s" % (platform["name"], format_version(platform["since"])))

	if obj.has_key("availability") and obj['availability'] == 'creation':
		res.append("@creationOnly")
	if obj.has_key("availability") and obj['availability'] == 'not-creation':
		res.append("@nonCreation")
	if obj.has_key("extends"):
		res.append("@extends %s" % (obj["extends"]))

	if(len(res) == 0):
		return ""

	return "\t * " + "\n\t * ".join(res) + "\n"

# @deprecated and @removed are multi-line tags, so this must be 
# inserted after the summary and description, or the summary will get
# included as part of the deprecation.
def output_deprecation_for_obj(annotated_obj):
	obj = annotated_obj.api_obj
	if obj.has_key("deprecated"):
		if obj["deprecated"].has_key("removed"):
			str = "@removed  %s" % (obj["deprecated"]["removed"])
		else:
			str = "@deprecated %s" % (obj["deprecated"]["since"])
		if obj["deprecated"].has_key("notes"):
			str += " %s" % markdown_to_html(obj["deprecated"]["notes"])
			str = str.replace("\n", "\n\t * ")
		return "\t * %s\n" % str
	else:
		return ""


def output_example(desc, code, convert_empty_code):
	if len(desc) == 0 and len(code) == 0:
		return None
	# sometimes if there is only one example
	if len(code) == 0 and convert_empty_code == True:
		# no code? probably desc contains the code
		code = desc
		desc = []

	# determine if we need t remove leading spaces from all code lines
	need_strip = True
	for line in code:
		if len(line) > 0 and line[0:4] != FOUR_SPACES:
			need_strip = False
			break

	if need_strip:
		stripped_code = []
		for line in code:
			stripped_code.append(line[4:])

		code = stripped_code

	# hack - insert &shy; to avoid having closing comment sign within JSDUck markup
	code = "\n".join(code).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("*/", "*&shy;/")
	desc = "\n".join(desc)

	if len(desc) > 0 and len(code) > 0:
		return "<p>%s</p><pre>%s</pre>" % (markdown_to_html(desc), code)
	elif len(desc) == 0 and len(code) > 0:
		return "<pre>%s</pre>" % (code)
	elif len(desc) > 0 and len(code) == 0:
		return "<p>%s</p>" % markdown_to_html(desc)


def output_examples_for_obj(obj):
	res = []
	if obj.has_key("examples"):
		if len(obj['examples']) == 1:
			res.append("<h3>Example</h3>")
		else:
			res.append("<h3>Examples</h3>")

		for example in obj['examples']:
			res.append("<h4>%s</h4>" % (example['title']))
			body = example['example']
			code = []
			desc = []
			desc_finished = False
			prev_line_empty = False
			first_code_block = True
			for line in body.splitlines():
				# parse description part until code starts
				# skip empty string between desc and code
				if not desc_finished:
					if prev_line_empty == True and (line.find(FOUR_SPACES) == 0 or line.find('\t') == 0):
						desc_finished = True
				else:
					# parsing code until code finishes or another description starts
					if line.find(FOUR_SPACES) != 0 and line.find('\t') != 0 and len(line) != 0:
						# code block finished - another description started - flush content
						desc_finished = False
						res.append(output_example(desc, code, first_code_block))
						first_code_block = False
						code = []
						desc = []


				if not desc_finished:
					desc.append(line)
				else:
					code.append(line)

				prev_line_empty = len(line.strip()) == 0

			res.append(output_example(desc, code, first_code_block))

	res = filter(None, res)
	if(len(res) == 0):
		return ""
	return "\t * " + "\n\t * ".join(res) + "\n"

def transform_type(type):
	if isinstance(type, list):
		# type consist of more then one type
		return "/".join(map((lambda typ: transform_type(typ)), type))
	if type.startswith("Array<"):
		type = re.sub(r'Array<(.*?)>', r'\1', type)
		type = transform_type(type) + "[]"
	elif type == "Dictionary":
		type = "Dictionary"
	elif type.startswith("Dictionary<"):
		type = re.sub(r'Dictionary<(.*?)>', r'\1', type)
		type = "Dictionary<%s>" % (type)
	elif type == 'Callback':
		type = "Function"
	elif type.startswith("Callback<"):
		type = re.sub(r'Callback<(.*?)>', r'\1', type)
		type = "Callback<%s>" % (type)
	return type

def has_ancestor(one_type, ancestor_name):
	if one_type["name"] == ancestor_name:
		return True
	if "extends" in one_type and one_type["extends"] == ancestor_name:
		return True
	elif "extends" not in one_type:
		if ancestor_name == 'Global':
			# special case for "Global" types - they do not have @extends statement
			return one_type["name"].find('Global') == 0
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

def get_summary_and_description(api_obj):
	summary = None
	desc = None
	if api_obj.has_key("summary"):
		summary = markdown_to_html(api_obj["summary"])
	if api_obj.has_key("description"):
		desc = markdown_to_html(api_obj["description"])

	res = u""
	if summary != None:
		res = u"\t * " + summary + "\n"
		if desc != None:
			res += u"\t * @description " + desc + "\n"
	elif desc != None:
		# use description if there is no summary
		res = u"\t * " + desc
	return res

def generate(raw_apis, annotated_apis, options):
	global all_annotated_apis, apis
	all_annotated_apis = annotated_apis
	apis = raw_apis

	if options is not None and (not hasattr(options, "output") or options.output is None or len(options.output) == 0):
		log.error ("'output' option not provided")

	if options is not None and not os.path.exists(options.output):
		os.makedirs(options.output)

	# Write the output files
	if options is not None:
		log.info("Creating titanium.js in %s" % options.output)
		output = open(os.path.join(options.output, "titanium.js"), "w")
		for name in annotated_apis:
			annotated_obj = annotated_apis[name]
			write_utf8(output, "/**\n\t * @class %s\n" % (annotated_obj.name))

			if annotated_obj.typestr == "module" and annotated_obj.parent is None:
				write_utf8(output, '\t * @typestr Module\n')
			else:
				typestr = ''
				if annotated_obj.typestr == "module":
					typestr = "Submodule"
				elif annotated_obj.typestr == "proxy":
					typestr = "Object"
				elif annotated_obj.typestr == "method":
					typestr = "Function"
				elif annotated_obj.typestr == "property":
					typestr = "Property"
				elif annotated_obj.typestr == "event":
					typestr = "Event"
				elif annotated_obj.typestr == "parameter":
					typestr = "Parameter"

				if len(typestr) > 0 and annotated_obj.parent is not None:
					write_utf8(output, '\t * @typestr %s of %s\n' % (typestr, annotated_obj.parent.name))
				else:
					write_utf8(output, '\t * @typestr %s\n' % (typestr))
			
			if not (has_ancestor(raw_apis[name], "Titanium.Proxy") or has_ancestor(raw_apis[name], "Global")):
				write_utf8(output, "\t * @pseudo\n")
			write_utf8(output, output_properties_for_obj(annotated_obj))
			write_utf8(output, get_summary_and_description(annotated_obj.api_obj))
			write_utf8(output, output_examples_for_obj(annotated_obj.api_obj))
			write_utf8(output, output_deprecation_for_obj(annotated_obj))
			write_utf8(output, "\t */\n\n")

			p = annotated_obj.properties
			for k in p:
				# Do not insert records for inherited members
				if k.inherited_from:
					continue
				obj = k.api_obj
				getter_ok = True
				setter_ok = True
				if k.permission == "read-only" or k.availability == "creation":
					setter_ok = False
				if k.permission == "write-only":
					getter_ok = False
				if "accessors" in obj and not obj["accessors"]:
					getter_ok = setter_ok = False

				if k.default is not None:
					default_val = remove_p_tags(markdown_to_html(str(k.default)))
					write_utf8(output, '/**\n\t * @property [%s=%s]\n' % (k.name, default_val))
				else:
					write_utf8(output, "/**\n\t * @property %s\n" % (k.name))

				if obj.has_key('type'):
					write_utf8(output, "\t * @type %s\n" % (transform_type(obj["type"])))
				if obj.has_key('permission') and obj["permission"] == "read-only":
					write_utf8(output, "\t * @readonly\n")
				write_utf8(output, output_properties_for_obj(k))
				write_utf8(output, get_summary_and_description(obj))
				write_utf8(output, output_examples_for_obj(obj))
				write_utf8(output, output_deprecation_for_obj(k))
				write_utf8(output, " */\n\n")

			p = annotated_obj.methods
			for k in p:
				# Do not insert records for inherited members
				if k.inherited_from:
					continue
				obj = k.api_obj
				write_utf8(output, "/**\n\t * @method %s\n" % (k.name))
				write_utf8(output, get_summary_and_description(obj))
				write_utf8(output, output_examples_for_obj(obj))
				write_utf8(output, output_deprecation_for_obj(k))

				if obj.has_key("parameters"):
					for param in obj["parameters"]:
						if "summary" in param:
							summary = param["summary"]
							if "repeatable" in param and param["repeatable"]:
								repeatable = "..."
							else:
								repeatable = ""
						type = "{" + transform_type(param["type"]) + repeatable + "}" if param.has_key("type") else ""
						optional = "(optional)" if param.has_key('optional') and param["optional"] == True else ""
						if param.has_key('default'):
							default_val = remove_p_tags(markdown_to_html(str(param['default'])))
							write_utf8(output, "\t * @param %s [%s=%s] %s\n\t * %s\n" % (type, param['name'], default_val, optional, markdown_to_html(summary)))
						else:
							write_utf8(output, "\t * @param %s %s %s\n\t * %s\n" % (type, param['name'], optional, markdown_to_html(summary)))

				if obj.has_key("returns"):
					returntypes = obj["returns"]
					summary = ""
					# check for the object form first
					if "type" in returntypes:
						type = "{" + transform_type(returntypes["type"]) + "}" 
						summary = returntypes["summary"] if "summary" in returntypes else ""
					else:
						# could be an array, check if it's iterable
						if hasattr(returntypes, "__getitem__") or hasattr(returntypes, "__iter__"):
							type = ""
							for one_returntype in returntypes:
								if type == "":
									type = "{" + transform_type(one_returntype["type"])
								else:
									type = type + "/" + transform_type(one_returntype["type"])
								# Can't handle multiple summaries, only take one.
								if summary == "" and summary in one_returntype:
									summary = one_returntype["summary"]
							type = type + "}"
						else:
							log.warn("returns for %s should be an array or a dict." % obj["name"]);
					write_utf8(output, "\t * @return %s %s\n" % (type, markdown_to_html(summary)))
				else:
					write_utf8(output, "\t * @return void\n")

				write_utf8(output, output_properties_for_obj(k))
				write_utf8(output, "\t*/\n\n")

			p = annotated_obj.events
			for k in p:
				# Do not insert records for inherited members
				if k.inherited_from:
					continue
				obj = k.api_obj
				write_utf8(output, "/**\n\t * @event %s\n" % (k.name))
				write_utf8(output, get_summary_and_description(obj))
				write_utf8(output, output_examples_for_obj(obj))

				if k.properties is not None:
					for param in k.properties:
						if "deprecated" in param.api_obj:
							deprecated = "(deprecated)" 
						else:
							deprecated = ""
						platforms = "("+" ".join(param.api_obj['platforms'])+")" if param.api_obj.has_key('platforms') and param.api_obj["platforms"] else ""
						if param.api_obj.has_key('type'):
							write_utf8(output, "\t * @param {%s} %s %s %s\n" % (transform_type(param.api_obj['type']), deprecated, platforms, param.name))
						else:
							write_utf8(output, "\t * @param %s %s %s\n" % (deprecated, platforms, param.name))
						write_utf8(output, get_summary_and_description(param.api_obj))


				write_utf8(output, output_properties_for_obj(k))
				write_utf8(output, "\t*/\n\n")

			# handle excluded members
			api_obj = annotated_obj.api_obj
			if "excludes" in api_obj:
				for member_type in [ "properties", "methods", "events" ]:
					if member_type in api_obj["excludes"]:
						annotation_string = { "properties":"@property", "methods":"@method", 
								"events":"@event" }[member_type]
						excluded_members = api_obj["excludes"][member_type]
						for one_member in excluded_members:
							write_utf8(output, "/**\n\t * %s %s \n\t * @hide\n*/\n" % (annotation_string, one_member))

		output.close()
