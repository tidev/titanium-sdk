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

templates = {} # cache templates so we don't need to load them each time
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
		template = None
		if templates.has_key(one_type.template_html):
			template = templates[one_type.template_html]
		else:
			template_file = os.path.join(template_dir, "%s.html" % one_type.template_html)
			template = template_lookup.get_template("%s.html" % one_type.template_html)
			templates[one_type.template_html] = template
		output = template.render(config=options, apis=annotated_apis, data=one_type)
		filename = os.path.join(options.output,'%s.html' % one_type.get_filename_html())
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
