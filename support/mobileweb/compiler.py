#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Project Compiler
#

import os, sys, time, datetime, simplejson, codecs, shutil, subprocess, mako.template
from tiapp import *
#re, base64, sgmllib, xml

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS'];

year = datetime.datetime.now().year

HTML_HEADER = """<!--
	WARNING: this is generated code and will be lost if changes are made.
	This generated source code is Copyright (c) 2010-%d by Appcelerator, Inc. All Rights Reserved.
	-->""" % year

HEADER = """/**
 * WARNING: this is generated code and will be lost if changes are made.
 * This generated source code is Copyright (c) 2010-%d by Appcelerator, Inc. All Rights Reserved.
 */
""" % year

class Compiler(object):

	def __init__(self, project_path, deploytype):
		
		start_time = time.time()
		self.packages = []
		self.dependencies = []
		
		self.minify = deploytype == "production"
		
		# initialize paths
		self.sdk_path = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.sdk_src_path = os.path.join(self.sdk_path, 'src')
		self.themes_path = os.path.join(self.sdk_path, 'themes')
		self.ti_package_path = os.path.join(self.sdk_path, 'titanium')
		self.modules_path = os.path.abspath(os.path.join(self.sdk_path, '../../../../modules/mobileweb'))
		self.project_path = project_path
		self.build_path = os.path.join(project_path, 'build', 'mobileweb')
		self.resources_path = os.path.join(project_path, 'Resources')
		self.ti_js_file = os.path.join(self.build_path, 'titanium.js')
		
		sdk_version = os.path.basename(os.path.abspath(os.path.join(self.sdk_path, '../')))
		print '[INFO] Titanium Mobile Web Compiler v%s' % sdk_version
		
		# read the package.json
		self.load_package_json()
		
		# register the titanium package
		self.packages.append({
			'name': self.package_json['name'],
			'location': './titanium',
			'main': self.package_json['main']
		})
		# self.dependencies += [self.compact_path('titanium/' + self.package_json['main'])]
		
		# read the tiapp.xml
		tiapp_xml = TiAppXML(os.path.join(self.project_path, 'tiapp.xml'))
		print '[INFO] Compiling Mobile Web project "%s" [%s]' % (tiapp_xml.properties['name'], deploytype)
		
		# create the build directory
		if os.path.exists(self.build_path):
			shutil.rmtree(self.build_path, True)
		try:
			os.makedirs(self.build_path)
		except:
			pass
		
		# copy all of the project's resources to the build directory
		self.copy(self.resources_path, self.build_path)
		self.copy(self.ti_package_path, os.path.join(self.build_path, 'titanium'))
		
		# scan project for dependencies
		print '[INFO] Scanning project for dependencies...'
		# TODO: scan the entire project's source and identify all dependencies
		self.dependencies += [
			# these MUST be ordered correctly!
			
			# building blocks
			'Ti',
			'Ti/_',
			'Ti/_/browser',
			'Ti/_/css',
			'Ti/_/declare',
			'Ti/_/dom',
			'Ti/_/event',
			'Ti/_/lang',
			'Ti/_/ready',
			'Ti/_/string',
			'Ti/_/style',
			
			# AMD plugins
			'Ti/_/include',
			'Ti/_/text',
			
			# base classes
			'Ti/_/Evented',
			'Ti/UI',
			'Ti/_/Gestures/GestureRecognizer',
			'Ti/_/Gestures/DoubleTap',
			'Ti/_/Gestures/LongPress',
			'Ti/_/Gestures/Pinch',
			'Ti/_/Gestures/SingleTap',
			'Ti/_/Gestures/Swipe',
			'Ti/_/Gestures/TouchStart',
			'Ti/_/Gestures/TouchMove',
			'Ti/_/Gestures/TouchEnd',
			'Ti/_/Gestures/TouchCancel',
			'Ti/_/Gestures/TwoFingerTap',
			'Ti/_/UI/Element',
			'Ti/_/Layouts/Base',
			'Ti/_/Layouts/Absolute',
			'Ti/_/Layouts/Horizontal',
			'Ti/_/Layouts/Vertical',
			'Ti/_/Layouts',
			
			# core classes
			'Ti/Accelerometer',
			'Ti/Analytics',
			'Ti/API',
			'Ti/App',
			'Ti/App/Properties',
			'Ti/Blob',
			'Ti/Contacts',
			'Ti/Database',
			'Ti/Facebook',
			'Ti/Filesystem',
			'Ti/Geolocation',
			'Ti/Locale',
			'Ti/Map',
			'Ti/Media',
			'Ti/Network',
			'Ti/Network/HTTPClient',
			'Ti/Platform',
			'Ti/Platform/DisplayCaps',
			'Ti/Gesture',
			'Ti/XML',
			
			# UI constants
			'Ti/UI/MobileWeb/TableViewSeparatorStyle',
			
			# View classes
			'Ti/UI/View',
			'Ti/Media/VideoPlayer',
			'Ti/UI/TableViewRow',
			
			# SuperView classes
			'Ti/_/UI/SuperView',
			'Ti/UI/Tab',
			'Ti/UI/TabGroup',
			'Ti/UI/Window',
			
			# Widget classes
			'Ti/_/UI/Widget',
			'Ti/_/UI/FontWidget',
			'Ti/_/UI/TextBox',
			'Ti/UI/2DMatrix',
			'Ti/UI/ActivityIndicator',
			'Ti/UI/AlertDialog',
			'Ti/UI/Animation',
			'Ti/UI/Button',
			'Ti/UI/ImageView',
			'Ti/UI/Label',
			'Ti/UI/ScrollableView',
			'Ti/UI/ScrollView',
			'Ti/UI/Slider',
			'Ti/UI/Switch',
			'Ti/UI/TableViewSection',
			'Ti/UI/TableView',
			'Ti/UI/TextArea',
			'Ti/UI/TextField',
			'Ti/_/text!Ti/_/UI/WebViewBridge.js',
			'Ti/UI/WebView',
			'Ti/Utils',
			
			'app.js'
		]
		
		# detect Ti+ modules
		if len(tiapp_xml.properties['modules']):
			print '[INFO] Locating Ti+ modules…'
			for module in tiapp_xml.properties['modules']:
				# TODO: check if platform is even defined!
				
				if module['platform'] == 'mobileweb':
					module_dir = os.path.join(self.modules_path, module['id'], module['version'])
					if not os.path.exists(module_dir):
						print '[ERROR] Unable to find Ti+ module "%s", v%s' % (module['id'], module['version'])
						sys.exit(1)
					
					module_package_json_file = os.path.join(module_dir, 'package.json')
					if not os.path.exists(module_package_json_file):
						print '[ERROR] Ti+ module "%s" is invalid: missing package.json' % module['id']
						sys.exit(1)
					
					module_package_json = simplejson.load(codecs.open(module_package_json_file, 'r', 'utf-8'))
					main_file = module_package_json['main']
					if main_file.endswith('.js'):
						main_file = main_file[:-3]
					main_file_path = os.path.join(module_dir, main_file + '.js')
					
					if not os.path.exists(main_file_path):
						print '[ERROR] Ti+ module "%s" is invalid: missing main "%s"' % (module['id'], main_file + '.js')
						sys.exit(1)
					
					self.dependencies.append(main_file)
					
					self.packages.append({
						'name': module['id'],
						'location': './modules/' + module['id'],
						'main': main_file
					})
					
					print '[INFO] Bundling Ti+ module "%s"' % module['id']
					
					# TODO: need to combine ALL Ti+ module .js files into the titanium.js, not just the main file
					
					# TODO: need to combine ALL Ti+ module .css files into the titanium.css
					
					# copy entire module directory to build directory
					shutil.copytree(module_dir, os.path.join(self.build_path, 'modules', module['id']))
		
		print '[INFO] Found %s dependenc%s' % (len(self.dependencies), 'y' if len(self.dependencies) == 1 else 'ies')
		
		# TODO: break up the dependencies into layers
		
		# build the titanium.js
		print '[INFO] Assembling titanium.js...'
		ti_js = codecs.open(self.ti_js_file, 'w', encoding='utf-8')
		ti_js.write(HEADER + '\n')
		
		# 1) read in the config.js and fill in the template
		ti_js.write(mako.template.Template(codecs.open(os.path.join(self.sdk_src_path, 'config.js'), 'r', 'utf-8').read()).render(
			app_analytics=tiapp_xml.properties['analytics'],
			app_copyright=tiapp_xml.properties['copyright'],
			app_description=tiapp_xml.properties['description'],
			app_guid=tiapp_xml.properties['guid'],
			app_id=tiapp_xml.properties['id'],
			app_name=tiapp_xml.properties['name'],
			app_publisher=tiapp_xml.properties['publisher'],
			app_url=tiapp_xml.properties['url'],
			app_version=tiapp_xml.properties['version'],
			deploy_type=deploytype,
			packages=simplejson.dumps(self.packages, sort_keys=True),
			project_id=tiapp_xml.properties['id'],
			project_name=tiapp_xml.properties['name'],
			ti_githash=self.package_json['titanium']['githash'],
			ti_timestamp=self.package_json['titanium']['timestamp'],
			ti_version=sdk_version,
			jsQuoteEscapeFilter=lambda str: str.replace("\\\"","\\\\\\\"")
		))
		
		# 2) copy in the loader
		ti_js.write(codecs.open(os.path.join(self.sdk_src_path, 'loader.js'), 'r', 'utf-8').read())
		
		# 3) cache the dependencies
		ti_js.write('require.cache({\n');
		first = True
		for x in self.dependencies:
			dep = self.resolve(x)
			if not len(dep):
				continue
			if not first:
				ti_js.write(',')
			first = False
			filename = dep[1]
			if not filename.endswith('.js'):
				filename += '.js'
			ti_js.write('"%s":function(){\n%s\n}\n' % (x, codecs.open(os.path.join(dep[0], filename), 'r', 'utf-8').read()))
		ti_js.write('});')
		
		# 4) write the ti.app.properties
		if len(tiapp_xml.app_properties):
			s = ''
			for name in tiapp_xml.app_properties:
				prop = tiapp_xml.app_properties[name]
				if prop['type'] == 'bool':
					s += 'p.setBool("' + name + '",' + prop['value'] + ');'
				elif prop['type'] == 'int':
					s += 'p.setInt("' + name + '",' + prop['value'] + ');'
				elif prop['type'] == 'double':
					s += 'p.setDouble("' + name + '",' + prop['value'] + ');'
				else:
					s += 'p.setString("' + name + '","' + str(prop['value']).replace('"', '\\"') + '");'
			ti_js.write('require("Ti/App/Properties", function(p) {%s}' % s)
		
		# 5) close the titanium.js
		ti_js.close()
		
		# assemble the titanium.css file
		print '[INFO] Assembling titanium.css...'
		self.ti_css_file = os.path.join(self.build_path, 'titanium.css')
		ti_css = codecs.open(self.ti_css_file, 'w', encoding='utf-8')
		
		# TODO: need to rewrite absolute paths for urls
		ti_css.write(HEADER + '\n' + codecs.open(os.path.join(self.themes_path, 'common.css'), 'r', 'utf-8').read())
		
		# read in the 
		# TODO: get theme from tiapp.xml
		theme = 'titanium'
		if len(theme):
			theme_path = os.path.join(self.resources_path, theme)
			if not os.path.exists(theme_path):
				theme_path = os.path.join(self.themes_path, theme)
			if not os.path.exists(theme_path):
				print '[ERROR] Unable to locate theme "%s"' % theme
			for dirname, dirnames, filenames in os.walk(theme_path):
				for filename in filenames:
					fname, ext = os.path.splitext(filename.lower())
					if ext == '.css':
						ti_css.write(codecs.open(os.path.join(dirname, filename), 'r', 'utf-8').read())
		
		# detect any fonts and add font face rules to the css file
		fonts = {}
		for dirname, dirnames, filenames in os.walk(self.resources_path):
			for filename in filenames:
				fname, ext = os.path.splitext(filename.lower())
				if ext == '.otf' or ext == '.woff':
					if not fname in fonts:
						fonts[fname] = []
					fonts[fname].append(os.path.join(dirname, filename)[len(self.resources_path):])
		for font in fonts:
			ti_css.write('@font-face{font-family:%s;src:url(%s);}\n' % (font, '),url('.join(fonts[font])))
		
		# close the titanium.css
		ti_css.close()
		
		if self.minify:
			for root, dirs, files in os.walk(self.build_path):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)
				for dest in files:
					if dest in ignoreFiles or dest.startswith('._'):
						continue
					fname, ext = os.path.splitext(dest.lower())
					dest = os.path.join(root, dest)
					if ext == '.js':
						source = dest + '.uncompressed.js'
						print '[INFO] Minifying %s' % dest
						os.rename(dest, source)
						p = subprocess.Popen('java -jar "%s" -Djava.awt.headless=true --compilation_level SIMPLE_OPTIMIZATIONS --js "%s" --js_output_file "%s"' % (os.path.join(self.sdk_path, 'closureCompiler', 'compiler.jar'), source, dest), shell=True, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
						stdout, stderr = p.communicate()
						if p.returncode != 0:
							print '[ERROR] Failed to minify "%s"' % dest
							for line in stderr.split('\n'):
								if len(line):
									print '[ERROR]    %s' % line
							print '[WARN] Leaving %s un-minified' % dest
							os.remove(dest)
							shutil.copy(source, dest)
					# elif ext == '.css':
					#	TODO: minify css
		
		# get status bar style
		status_bar_style = tiapp_xml.properties['statusbar-style']
		if status_bar_style == 'opaque_black' or status_bar_style == 'opaque':
			status_bar_style = 'black'
		elif status_bar_style == 'translucent_black' or status_bar_style == 'transparent' or status_bar_style == 'translucent':
			status_bar_style = 'black-translucent'
		else:
			status_bar_style = 'default'
		
		# populate index.html
		index_html_file = codecs.open(os.path.join(self.build_path, 'index.html'), 'w', encoding='utf-8')
		index_html_file.write(mako.template.Template(codecs.open(os.path.join(self.sdk_src_path, 'index.html'), 'r', 'utf-8').read()).render(
			ti_header=HTML_HEADER,
			project_name=tiapp_xml.properties['name'],
			app_description=tiapp_xml.properties['description'],
			app_publisher=tiapp_xml.properties['publisher'],
			ti_generator="Appcelerator Titanium Mobile " + sdk_version,
			ti_statusbar_style=status_bar_style,
			ti_css=codecs.open(self.ti_css_file, 'r', 'utf-8').read(),
			ti_js=codecs.open(self.ti_js_file, 'r', 'utf-8').read()
		))
		index_html_file.close()
		
		# create the favicon and apple touch icons
		icon_file = os.path.join(self.resources_path, tiapp_xml.properties['icon'])
		fname, ext = os.path.splitext(icon_file.lower())
		if os.path.exists(icon_file) and (ext == '.png' or ext == '.jpg' or ext == '.gif'):
			self.build_icons(icon_file)
		else:
			icon_file = os.path.join(self.resources_path, 'mobileweb', 'appicon.png')
			if os.path.exists(icon_file):
				self.build_icons(icon_file)
		
		total_time = time.time() - start_time
		total_seconds = int(round(total_time % 60))
		print '[INFO] Finished in %s seconds' % total_seconds
	
	def resolve(self, it):
		it = it.split('!')[0]
		if it.find(':') != -1:
			return []
		if it.startswith('/') or it.endswith('.js'):
			return [self.build_path, it]
		parts = it.split('/')
		for p in self.packages:
			if p['name'] == parts[0]:
				return [self.compact_path(os.path.join(self.build_path, p['location'])), it]
		return [self.build_path, it]
	
	def copy(self, src_path, dest_path):
		print '[INFO] Copying %s...' % src_path
		for root, dirs, files in os.walk(src_path):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)
			for file in files:
				if file in ignoreFiles or file.startswith('._'):
					continue
				source = os.path.join(root, file)
				dest = os.path.expanduser(source.replace(src_path, dest_path, 1))
				dest_dir = os.path.expanduser(os.path.split(dest)[0])
				if not os.path.exists(dest_dir):
					os.makedirs(dest_dir)
				shutil.copy(source, dest)
	
	def compact_path(self, path):
		result = []
		path = path.replace('\\', '/').split('/');
		while len(path):
			segment = path[0]
			path = path[1:]
			if segment == '..' and len(result) and lastSegment != '..':
				result.pop()
				lastSegment = result[-1]
			elif segment != '.':
				lastSegment = segment
				result.append(segment)
		return '/'.join(result);
	
	def build_icons(self, src):
		print '[INFO] Resizing app icon "%s"' % src
		s = 'java -cp "%s:%s" -Djava.awt.headless=true resize "%s"' % (os.path.join(self.sdk_path, 'imageResizer'), os.path.join(self.sdk_path, 'imageResizer', 'imgscalr-lib-4.2.jar'), src)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-precomposed.png'), 57, 57)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-57x57-precomposed.png'), 57, 57)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-72x72-precomposed.png'), 72, 72)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-114x114-precomposed.png'), 114, 114)
		subprocess.call(s, shell=True)
	
	def load_package_json(self):
		package_json_file = os.path.join(self.ti_package_path, 'package.json')
		if not os.path.exists(package_json_file):
			print '[ERROR] Unable to open titanium package manifest "%s"' % package_json_file
			sys.exit(1)
		self.package_json = simplejson.load(codecs.open(package_json_file, 'r', 'utf-8'))