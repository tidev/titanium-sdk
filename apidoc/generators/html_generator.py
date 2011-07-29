#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
import os, sys

this_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.abspath(os.path.join(this_dir, '..')))
from common import info, err, warn, msg

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
	# TODO move html-specific stuff from docgen.py to here
	annotated_obj.set_annotation_complete("html")

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
	filename = os.path.join(options.output,'%s.html' % annotated_obj.get_filename_html())
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
