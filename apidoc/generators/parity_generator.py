#!/usr/bin/env python
#
# Copyright (c) 2013 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)

import os, sys, re
from common import DEFAULT_PLATFORMS, pretty_platform_name

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from tilogger import *
log = TiLogger(None)

all_annotated_apis = None
apis = None

# These top-level namespaces are added for documentation purposes
special_toplevel_types = [ "Global", "Modules" ]

def is_special_toplevel_type(one_type):
	for special_type in special_toplevel_types:
		if one_type["name"].find(special_type) == 0:
			return True
	return False

def get_platforms_available(platforms):
	res = ""
	for platform in DEFAULT_PLATFORMS:
		if any(platform == p["name"] for p in platforms):
			res = res + "\t<td class=\"yes\">YES</td>\n"
		else:
			res = res + "\t<td class=\"no\">NO</td>\n" 
	return res

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
	
	outfile = "api_parity.html" 
	log.info("Generating %s" % outfile)

	# Write the output files
	if options is not None:
		log.info("Creating %s in %s" % (outfile, options.output))
		output = open(os.path.join(options.output, outfile), "w")
		
		output.write("<style>\n")
		output.write("html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, font, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td { background: transparent; border: 0; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline; } body { line-height: 1; font-family: Helvetica, Arial, sans-serif; margin: 20px; font-size: 12px; } ol, ul { list-style: none; } blockquote, q { quotes: none; } :focus { outline: 0; } ins { text-decoration: none; } del { text-decoration: line-through; } table { border-collapse: collapse; border-spacing: 0; } a { text-decoration: none; } a:hover { text-decoration: underline; } th { padding: 5px 10px; background: #CCC; } td { border: 1px solid #CCC; padding: 5px; } .yes { background-color:#007700; color: #FFF; text-align: center; font-weight: bold; } .no { background-color:#770000; color:#FFF; text-align: center; font-weight: bold; } .module_parent { font-weight: bold } .module_child { padding-left: 20px }\n")
		output.write("</style>\n")
		
		
		output.write("<table>\n")
		output.write("<tr>\n")
		output.write("<th></th>\n")
		
		for platform in DEFAULT_PLATFORMS:
			output.write("\t<th>%s</th>\n" % pretty_platform_name(platform))	
		output.write("</tr>\n")

		api_names = annotated_apis.keys()
		api_names.sort()
		for name in api_names:
			annotated_obj = annotated_apis[name]
			
			pseudo_text = ""
			class_type = "normal_type"
			if annotated_obj.is_pseudotype and not is_special_toplevel_type(raw_apis[name]):
				pseudo_text = "(<i>pseudotype</i>)"
				class_type = "pseudo_type"
			
			output.write("<tr>\n")
			output.write("\t<td class=\"module_parent\" class=\"%s\">%s %s</td>\n" % (class_type, annotated_obj.name, pseudo_text)) 
			output.write( get_platforms_available(annotated_obj.platforms) )
			output.write("</tr>\n")
			
			attribute_names = { "properties":"property", "methods":"method", "events":"event" }
			for attr in ("properties", "methods", "events"):
				p = getattr(annotated_obj, attr)
				for k in p:
					output.write("<tr>\n")
					output.write("\t<td class=\"module_child\">%s.%s (<i>%s</i>)</td>\n" % (k.parent.name, k.name, attribute_names[attr]))
					output.write( get_platforms_available(annotated_obj.platforms) )
					output.write("</tr>\n")

		output.write("</table>\n")
		
		output.close()
