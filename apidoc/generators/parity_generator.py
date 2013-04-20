#!/usr/bin/env python
#
# Copyright (c) 2013 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)

import os, sys, re, textwrap
from common import DEFAULT_PLATFORMS, pretty_platform_name, is_platform_specific_namespace

this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))

from tilogger import *
log = TiLogger(None)

all_annotated_apis = None
apis = None
platform_counts = {}

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

# STATS
# takes a member and adds it to the count of APIs for each platform supported
def keep_stats(member):
	# filtering out platform specific namespaces
	if is_platform_specific_namespace(member.parent.name):
		return	
	for platform in member.platforms:
		platform_counts[platform["name"]] = platform_counts.get(platform["name"], 0) + 1
	platform_counts["total"] = platform_counts.get("total", 0) + 1

def get_stats():
	stat_rows = ""
	for platform in DEFAULT_PLATFORMS:
		stat_rows += "\t<th>%.2f%%</th>\n" % round(platform_counts.get(platform, 0)/float(platform_counts["total"])*100, 2)
	return stat_rows

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

	# Build the output text
	if options is not None:
		log.info("Creating %s in %s" % (outfile, options.output))
		output = open(os.path.join(options.output, outfile), "w")
		html = ""
		
		html += textwrap.dedent('''\
			<style>
				html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, font, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td { background: transparent; border: 0; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline; } body { line-height: 1; font-family: Helvetica, Arial, sans-serif; margin: 20px; font-size: 12px; } ol, ul { list-style: none; } blockquote, q { quotes: none; } :focus { outline: 0; } ins { text-decoration: none; } del { text-decoration: line-through; } table { border-collapse: collapse; border-spacing: 0; clear: both; } a { text-decoration: none; } a:hover { text-decoration: underline; } th { padding: 5px 10px; background: #CCC; } td { border: 1px solid #CCC; padding: 5px; } .yes { background-color:#007700; color: #FFF; text-align: center; font-weight: bold; } .no { background-color:#770000; color:#FFF; text-align: center; font-weight: bold; } .module_parent_title { font-weight: bold; } .module_child_title { padding-left: 20px; } div.options { float: left; margin: 0px 20px 10px 0px; } .stats_description { font-weight: normal; }
			</style>
		
			<style type="text/css" id="table_row_style">
				.module_child { display: table-row; } .pseudo_type { display: none; }
			</style>

			<script type="text/javascript">
			function toggleShowClass(clsName) {
				var showPseudo = document.getElementById('pseudo_type_checkbox').checked,
					showChildren = document.getElementById('module_members_checkbox').checked,
					rowCSS;

				if (showPseudo && showChildren) {
					rowCSS = ".pseudo_type { display: table-row; } .module_child { display: table-row; }";
				} else if (!showPseudo && showChildren) {
					rowCSS = ".module_child { display: table-row; } .pseudo_type { display: none; }";
				} else if (showPseudo && !showChildren) {
					rowCSS = ".pseudo_type { display: table-row; } .module_child { display: none; }";
				} else if (!showPseudo && !showChildren) {
					rowCSS = ".pseudo_type { display: none; } .module_child { display: none; }";
				}

				document.getElementById('table_row_style').innerHTML = rowCSS;
			}
			</script>

			<div id="options">
				<div class="option">
					Show Pseudotypes:
					<input type="checkbox" id="pseudo_type_checkbox" onclick="toggleShowClass()">
				</div>
				<div class="option">
					Show Members:
					<input type="checkbox" id="module_members_checkbox" onclick="toggleShowClass()" checked=true>
				</div>
			</div>
		''')
		
		html += textwrap.dedent('''\
			<table>
			<tr>
			<th></th>
		''')
		
		for platform in DEFAULT_PLATFORMS:	
			html += "\t<th>%s</th>\n" % pretty_platform_name(platform)
		html += "</tr>\n"

		api_names = annotated_apis.keys()
		api_names.sort()
		rows_html = ""
		for name in api_names:
			annotated_obj = annotated_apis[name]
			
			pseudo_text = ""
			class_type = "normal_type"
			if annotated_obj.is_pseudotype and not is_special_toplevel_type(raw_apis[name]):
				pseudo_text = "(<i>pseudotype</i>)"
				class_type = "pseudo_type"
			
			rows_html += "<tr class=\"%s module_parent\" element_type=\"%s\">\n" % (class_type, class_type)
			rows_html += "\t<td class=\"module_parent_title\" class=\"%s\">%s %s</td>\n" % (class_type, annotated_obj.name, pseudo_text)
			rows_html +=  get_platforms_available(annotated_obj.platforms) 
			rows_html += "</tr>\n"
			
			attribute_names = { "properties":"property", "methods":"method", "events":"event" }
			for attr in ("properties", "methods", "events"):
				p = getattr(annotated_obj, attr)
				for k in p:
					rows_html += "<tr class=\"%s module_child\" module_child=\"true\" element_type=\"%s\">\n" % (class_type, class_type)
					rows_html += "\t<td class=\"module_child_title\">%s.%s (<i>%s</i>)</td>\n" % (k.parent.name, k.name, attribute_names[attr])
					rows_html +=  get_platforms_available(k.platforms)
					rows_html += "</tr>\n"
					keep_stats(k)
		
		html += "<tr>\n"
		html += "\t<th class=\"stats_description\">API coverage of the platform excluding APIs namespaced under a platform --></th>\n"
		html += get_stats()
		html += "</tr>\n"

		html += rows_html
		html += "</table>\n"
		
		# Write the output files
		output.write(html);
		output.close()
