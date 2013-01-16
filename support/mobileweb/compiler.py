#!/usr/bin/env python

import os, sys, time, datetime, codecs, shutil, subprocess, re, math, base64
from stat import *
from tiapp import *
from xml.dom.minidom import parseString

# mako and simplejson are in support/common
this_dir = os.path.dirname(os.path.abspath(__file__))
common_dir = os.path.join(os.path.dirname(this_dir), "common")
sys.path.append(common_dir)
import mako.template
from mako import runtime
import simplejson
from csspacker import CSSPacker

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store']
ignoreDirs = ['.git','.svn','_svn','CVS']

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

def compare_versions(version1, version2):
	def normalize(v):
		v = '.'.join(map((lambda s:re.sub(r'[^\d]+(.*)$','',s)), v.split('.')[:3]))
		return [int(x) for x in re.sub(r'(\.0+)*$','', v).split(".")]
	return cmp(normalize(version1), normalize(version2))

class AppcTemplate(mako.template.Template):
	def render(self, *args, **data):
		return runtime._render(self, self.callable_, args, data, as_unicode=True)

class Compiler(object):

	def __init__(self, project_path, deploytype):
		start_time = time.time()
		self.minify = deploytype == "production"
		
		self.packages = []
		self.project_dependencies = []   # modules that the project uses
		self.modules_map = {}            # all modules including deps => individual module deps
		self.modules_to_cache = []       # all modules to be baked into require.cache()
		self.modules_to_load = []        # all modules to be required at load time
		self.tiplus_modules_to_load = [] # all modules to be required at load time
		
		# initialize paths
		self.sdk_path = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.sdk_src_path = os.path.join(self.sdk_path, 'src')
		self.themes_path = os.path.join(self.sdk_path, 'themes')
		self.ti_package_path = os.path.join(self.sdk_path, 'titanium')
		self.modules_path = os.path.abspath(os.path.join(self.sdk_path, '..', '..', '..', '..', 'modules'))
		self.project_path = project_path
		self.build_path = os.path.join(project_path, 'build', 'mobileweb')
		self.resources_path = os.path.join(project_path, 'Resources')
		self.i18n_path = os.path.join(project_path, 'i18n')
		self.ti_js_file = os.path.join(self.build_path, 'titanium.js')
		
		sdk_version = os.path.basename(os.path.abspath(os.path.join(self.sdk_path, '..')))
		print '[INFO] Titanium Mobile Web Compiler v%s' % sdk_version
		
		if not os.path.exists(self.project_path):
			print '[ERROR] Invalid project "%s"' % self.project_path
			sys.exit(1)
		
		# read the package.json
		self.load_package_json()
		
		# register the titanium package
		self.packages.append({
			'name': self.package_json['name'],
			'location': './titanium',
			'main': self.package_json['main']
		})
		
		# read the tiapp.xml
		tiapp_xml = TiAppXML(os.path.join(self.project_path, 'tiapp.xml'), deploytype)
		print '[INFO] Compiling Mobile Web project "%s" [%s]' % (tiapp_xml['name'], deploytype)
		
		# create the build directory
		if os.path.exists(self.build_path):
			shutil.rmtree(self.build_path, True)
		try:
			os.makedirs(self.build_path)
		except:
			pass
		
		# copy all of the project's resources to the build directory
		self.copy(self.themes_path, os.path.join(self.build_path, 'themes'))
		self.copy(self.resources_path, self.build_path, ['android', 'iphone'])
		self.copy(os.path.join(self.resources_path, 'mobileweb'), self.build_path, ['apple_startup_images', 'splash'])
		self.copy(os.path.join(self.resources_path, 'mobileweb', 'apple_startup_images', 'Default.jpg'), self.build_path)
		self.copy(os.path.join(self.resources_path, 'mobileweb', 'apple_startup_images', 'Default-Portrait.jpg'), self.build_path)
		self.copy(os.path.join(self.resources_path, 'mobileweb', 'apple_startup_images', 'Default-Landscape.jpg'), self.build_path)
		self.copy(self.ti_package_path, os.path.join(self.build_path, 'titanium'))
		
		# scan project for dependencies
		self.find_project_dependencies()
		
		# scan all dependencies for distinct list of modules
		self.find_modules_to_cache()
		self.modules_to_cache.append('Ti/_/image')
		self.modules_to_cache.append('Ti/_/include')
		if len(tiapp_xml['precache']['requires']):
			for req in tiapp_xml['precache']['requires']:
				self.modules_to_cache.append('commonjs:' + req)
		if len(tiapp_xml['precache']['includes']):
			for inc in tiapp_xml['precache']['includes']:
				self.modules_to_cache.append('url:' + inc)
		
		# find only the top most modules to be required
		areDeps = {}
		for module in self.modules_to_cache:
			# check if module is a dependent of another module
			for m in self.modules_map:
				deps = self.modules_map[m]
				if module in deps:
					areDeps[module] = 1
		for module in self.modules_map:
			if not module in areDeps:
				self.modules_to_load.append(module)
		
		# determine theme
		theme = tiapp_xml['mobileweb']['theme']
		if not os.path.exists(os.path.join(self.themes_path, theme)):
			print '[ERROR] Theme "%s" does not exist' % theme
			sys.exit(1)
				
		# check what we need to precache
		precache_images = []
		if 'Ti/UI/TableViewRow' in self.modules_map:
			precache_images.append('/themes/' + theme + '/UI/TableViewRow/child.png')
		if len(tiapp_xml['precache']['images']):
			for img in tiapp_xml['precache']['images']:
				precache_images.append(img)
		
		# detect Ti+ modules
		if len(tiapp_xml['modules']):
			print '[INFO] Locating Ti+ modules...'
			for module in tiapp_xml['modules']:
				if module['platform'] in ['', 'mobileweb', 'commonjs']:
					is_commonjs = False
					
					if 'version' in module and module['version']:
						# search <project dir>/modules/mobileweb/<module>/<version>/
						module_dir = os.path.join(self.project_path, 'modules', 'mobileweb', module['id'], module['version'])
						if not os.path.exists(module_dir):
							# search <project dir>/modules/commonjs/<module>/<version>/
							module_dir = os.path.join(self.project_path, 'modules', 'commonjs', module['id'], module['version'])
							if os.path.exists(module_dir):
								is_commonjs = True
							else:
								# search <global module dir>/<module>/<version>/
								module_dir = os.path.join(self.modules_path, 'mobileweb', module['id'], module['version'])
								if not os.path.exists(module_dir):
									# search <global commonjs dir>/<module>/<version>/
									module_dir = os.path.join(self.modules_path, 'commonjs', module['id'], module['version'])
									if os.path.exists(module_dir):
										is_commonjs = True
									else:
										print '[ERROR] Unable to find Ti+ module "%s", v%s' % (module['id'], module['version'])
										sys.exit(1)
					else:
						# no version number, gotta do it the hard way
						# search <project dir>/modules/mobileweb/<module>/
						module_dir = self.locate_module(os.path.join(self.project_path, 'modules', 'mobileweb', module['id']))
						if module_dir is None:
							# search <project dir>/modules/commonjs/<module>/<version>/
							module_dir = self.locate_module(os.path.join(self.project_path, 'modules', 'commonjs', module['id']))
							if module_dir is not None:
								is_commonjs = True
							else:
								# search <global module dir>/<module>/<version>/
								module_dir = self.locate_module(os.path.join(self.modules_path, 'mobileweb', module['id']))
								if module_dir is None:
									# search <global commonjs dir>/<module>/<version>/
									module_dir = self.locate_module(os.path.join(self.modules_path, 'commonjs', module['id']))
									if module_dir is not None:
										is_commonjs = True
									else:
										print '[ERROR] Unable to find Ti+ module "%s"' % module['id']
										sys.exit(1)
					
					module_package_json_file = os.path.join(module_dir, 'package.json')
					if not os.path.exists(module_package_json_file):
						print '[ERROR] Ti+ module "%s" is invalid: missing package.json' % module['id']
						sys.exit(1)
					
					module_manifest_file = os.path.join(module_dir, 'manifest')
					if not os.path.exists(module_manifest_file):
						print '[ERROR] Ti+ module "%s" is invalid: missing manifest' % module['id']
						sys.exit(1)
					
					manifest = {}
					for line in open(module_manifest_file).readlines():
						line = line.strip()
						if line[0:1] == '#': continue
						if line.find(':') < 0: continue
						key,value = line.split(':')
						manifest[key.strip()] = value.strip()
					
					if 'minsdk' in manifest and compare_versions(manifest['minsdk'], sdk_version) == 1:
						print '[ERROR] Ti+ module "%s" requires a minimum SDK version of %s: current version %s' % (module['id'], manifest['minsdk'], sdk_version)
						sys.exit(1)
					
					module_package_json = simplejson.load(codecs.open(module_package_json_file, 'r', 'utf-8'))
					main_file = module_package_json['main']
					if main_file.endswith('.js'):
						main_file = main_file[:-3]
					
					lib = ''
					if 'directories' in module_package_json and 'lib' in module_package_json['directories']:
						lib = module_package_json['directories']['lib']
						if lib.startswith('/'):
							lib = lib[1:]
					
					main_file_path = os.path.join(module_dir, lib, main_file + '.js')
					
					if not os.path.exists(main_file_path):
						print '[ERROR] Ti+ module "%s" is invalid: missing main "%s"' % (module['id'], main_file_path)
						sys.exit(1)
					
					print '[INFO] Bundling Ti+ module "%s" version %s' % (module['id'], manifest['version'])
					
					self.project_dependencies.append(main_file)
					
					module_name = module['id']
					if module['id'] != main_file:
						module_name += '/' + main_file
					if is_commonjs:
						self.modules_to_cache.append('commonjs:' + module_name)
					else:
						self.modules_to_cache.append(module_name)

					if not is_commonjs:
						self.tiplus_modules_to_load.append(module['id'])
					
					if len(lib):
						lib = '/' + lib
					
					self.packages.append({
						'name': module['id'],
						'location': './' + self.compact_path('modules/' + module['id'] + lib),
						'main': main_file,
						'root': 1
					})
					
					# TODO: need to combine ALL Ti+ module .js files into the titanium.js, not just the main file
					
					# TODO: need to combine ALL Ti+ module .css files into the titanium.css
					
					# copy entire module directory to build directory
					shutil.copytree(module_dir, os.path.join(self.build_path, 'modules', module['id']))
		
		# detect circular dependencies
		for module in self.modules_to_cache:
			if module in self.modules_map:
				mydeps = self.modules_map[module]
				for dep in mydeps:
					if dep in self.modules_map and module in self.modules_map[dep]:
						print '[WARN] Circular dependency detected: %s dependent on %s' % (module, dep)
		
		print '[INFO] Found %s dependenc%s, %s package%s, %s module%s' % (
			len(self.project_dependencies), 'y' if len(self.project_dependencies) == 1 else 'ies',
			len(self.packages), '' if len(self.packages) == 1 else 's',
			len(self.modules_to_cache), '' if len(self.project_dependencies) == 1 else 's')
		
		# TODO: break up the dependencies into layers
		
		# TODO: minify the project's code first
		
		app_names = {}
		locales = []
		if os.path.exists(self.i18n_path):
			print '[INFO] Processing i18n strings...'
			for dir in os.listdir(self.i18n_path):
				app = self.load_i18n(os.path.join(self.i18n_path, dir, 'app.xml'))
				if app is not None and 'appname' in app:
					app_names[dir] = app['appname']
				strings = self.load_i18n(os.path.join(self.i18n_path, dir, 'strings.xml'))
				if strings is not None:
					locales.append(dir)
					locale_path = os.path.join(self.build_path, 'titanium', 'Ti', 'Locale', dir)
					try:
						os.makedirs(locale_path)
					except:
						pass
					i18n_file = codecs.open(os.path.join(locale_path, 'i18n.js'), 'w', 'utf-8')
					i18n_file.write('define(%s);' % simplejson.dumps(strings))
					i18n_file.close()
					if dir in tiapp_xml['precache']['locales']:
						self.modules_to_cache.append('Ti/Locale/%s/i18n' % dir)
		
		# build the titanium.js
		print '[INFO] Assembling titanium.js...'
		ti_js = codecs.open(self.ti_js_file, 'w', 'utf-8')
		ti_js.write(HEADER + '\n')
		
		# 1) read in the config.js and fill in the template
		enableInstrumentation = tiapp_xml['mobileweb']['instrumentation'] == 'true' if 'instrumentation' in tiapp_xml['mobileweb'] else False
		ti_js.write(AppcTemplate(codecs.open(os.path.join(self.sdk_src_path, 'config.js'), 'r', 'utf-8').read(), input_encoding='utf-8', output_encoding='utf-8').render(
			app_analytics         = tiapp_xml['analytics'],
			app_copyright         = tiapp_xml['copyright'],
			app_description       = tiapp_xml['description'],
			app_guid              = tiapp_xml['guid'],
			app_id                = tiapp_xml['id'],
			app_name              = tiapp_xml['name'],
			app_names             = simplejson.dumps(app_names),
			app_publisher         = tiapp_xml['publisher'],
			app_url               = tiapp_xml['url'],
			app_version           = tiapp_xml['version'],
			deploy_type           = deploytype,
			locales               = simplejson.dumps(locales),
			packages              = simplejson.dumps(self.packages, sort_keys=True),
			project_id            = tiapp_xml['id'],
			project_name          = tiapp_xml['name'],
			ti_fs_registry        = tiapp_xml['mobileweb']['filesystem']['registry'],
			ti_theme              = theme,
			ti_githash            = self.package_json['titanium']['githash'],
			ti_timestamp          = self.package_json['titanium']['timestamp'],
			ti_version            = sdk_version,
			has_analytics_use_xhr = tiapp_xml['mobileweb']['analytics']['use-xhr'],
			has_show_errors       = 'false' if deploytype == 'production' or tiapp_xml['mobileweb']['disable-error-screen'] == 'true' else 'true',
			has_instrumentation   = 'true' if enableInstrumentation else 'false',
			jsQuoteEscapeFilter   = lambda str: str.replace("\\\"","\\\\\\\"")
		))
		
		# 2) copy in instrumentation if it's enabled
		if enableInstrumentation:
			ti_js.write(codecs.open(os.path.join(self.sdk_src_path, 'instrumentation.js'), 'r', 'utf-8').read())
		
		# 3) copy in the loader
		ti_js.write(codecs.open(os.path.join(self.sdk_src_path, 'loader.js'), 'r', 'utf-8').read() + '\n')
		
		# 4) cache the dependencies
		first = True
		require_cache_written = False
		module_counter = 0
		
		# uncomment next line to bypass module caching (which is ill advised):
		# self.modules_to_cache = {}
		
		for x in self.modules_to_cache:
			is_cjs = False
			if x.startswith('commonjs:'):
				is_cjs = True
				x = x[9:]
			dep = self.resolve(x, None)
			if not len(dep):
				continue
			if not require_cache_written:
				ti_js.write('require.cache({\n');
				require_cache_written = True;
			if not first:
				ti_js.write(',\n')
			first = False
			module_counter += 1
			filename = dep[1]
			if not filename.endswith('.js'):
				filename += '.js'
			file_path = os.path.join(dep[0], filename)
			if x.startswith('url:'):
				source = file_path + '.uncompressed.js'
				if self.minify:
					os.rename(file_path, source)
					print '[INFO] Minifying include %s' % file_path
					p = subprocess.Popen('java -Xms256m -Xmx256m -jar "%s" --compilation_level SIMPLE_OPTIMIZATIONS --js "%s" --js_output_file "%s"' % (os.path.join(self.sdk_path, 'closureCompiler', 'compiler.jar'), source, file_path), shell=True, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
					stdout, stderr = p.communicate()
					if p.returncode != 0:
						print '[ERROR] Failed to minify "%s"' % file_path
						for line in stderr.split('\n'):
							if len(line):
								print '[ERROR]    %s' % line
						print '[WARN] Leaving %s un-minified' % file_path
						os.remove(file_path)
						shutil.copy(source, file_path)
				ti_js.write('"%s":"%s"' % (x, codecs.open(file_path, 'r', 'utf-8').read().strip().replace('\\', '\\\\').replace('\n', '\\n\\\n').replace('\"', '\\\"')))
			elif is_cjs:
				ti_js.write('"%s":function(){\n/* %s */\ndefine(function(require, exports, module){\n%s\n});\n}' % (x, file_path.replace(self.build_path, ''), codecs.open(file_path, 'r', 'utf-8').read()))
			else:
				ti_js.write('"%s":function(){\n/* %s */\n\n%s\n}' % (x, file_path.replace(self.build_path, ''), codecs.open(file_path, 'r', 'utf-8').read()))
		
		image_mime_types = {
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.jpg': 'image/jpg',
			'.jpeg': 'image/jpg'
		}
		for x in precache_images:
			x = x.replace('\\', '/')
			y = x
			if y.startswith(os.sep):
				y = '.' + y
			img = os.path.join(self.resources_path, os.sep.join(y.split('/')))
			if os.path.exists(img):
				fname, ext = os.path.splitext(img.lower())
				if ext in image_mime_types:
					if not require_cache_written:
						ti_js.write('require.cache({\n');
						require_cache_written = True;
					if not first:
						ti_js.write(',\n')
					first = False
					module_counter += 1
					ti_js.write('"url:%s":"data:%s;base64,%s"' % (x, image_mime_types[ext], base64.b64encode(open(img,'rb').read())))
		
		if require_cache_written:
			ti_js.write('});\n')
		
		# 4) write the ti.app.properties
		def addProp(prop, val):
			tiapp_xml['properties'][prop] = {
				'type': 'string',
				'value': val
			}
		addProp('ti.fs.backend', tiapp_xml['mobileweb']['filesystem']['backend'])
		addProp('ti.map.backend', tiapp_xml['mobileweb']['map']['backend'])
		addProp('ti.map.apikey', tiapp_xml['mobileweb']['map']['apikey'])
		s = ''
		for name in tiapp_xml['properties']:
			prop = tiapp_xml['properties'][name]
			if prop['type'] == 'bool':
				s += 'p.setBool("' + name + '",' + prop['value'] + ');\n'
			elif prop['type'] == 'int':
				s += 'p.setInt("' + name + '",' + prop['value'] + ');\n'
			elif prop['type'] == 'double':
				s += 'p.setDouble("' + name + '",' + prop['value'] + ');\n'
			else:
				s += 'p.setString("' + name + '","' + str(prop['value']).replace('"', '\\"') + '");\n'
		ti_js.write('require("Ti/App/Properties", function(p) {\n%s});\n' % s)
		
		# 5) write require() to load all Ti modules
		self.modules_to_load.sort()
		self.modules_to_load += self.tiplus_modules_to_load
		ti_js.write('require(%s);\n' % simplejson.dumps(self.modules_to_load))
		
		# 6) close the titanium.js
		ti_js.close()
		
		# build the splash screen
		splash_html = ''
		splash_css = ''
		if tiapp_xml['mobileweb']['splash']['enabled'] == 'true':
			print '[INFO] Processing splash screen...'
			splash_path = os.path.join(self.project_path, 'Resources', 'mobileweb', 'splash')
			splash_root_path = os.path.join(self.project_path, 'Resources')
			if not os.path.exists(splash_path):
				splash_path = os.path.join(self.sdk_path, 'splash')
				splash_root_path = splash_path
			splash_html_file = os.path.join(splash_path, 'splash.html')
			splash_css_file = os.path.join(splash_path, 'splash.css')
			if os.path.exists(splash_html_file):
				splash_html = codecs.open(splash_html_file, 'r', 'utf-8').read()
			if os.path.exists(splash_css_file):
				splash_css = codecs.open(splash_css_file, 'r', 'utf-8').read()
				if tiapp_xml['mobileweb']['splash']['inline-css-images'] == 'true':
					parts = splash_css.split('url(')
					for i in range(1, len(parts)):
						j = parts[i].find(')')
						if j != -1:
							img = parts[i][:j].replace('"', '').replace('\'', '').strip()
							if img.find('data:') == -1:
								if img[1] == '/':
									img_path = os.path.join(splash_root_path, img[1:])
								else:
									img_path = os.path.join(splash_path, img)
								if os.path.exists(img_path):
									fname, ext = os.path.splitext(img_path.lower())
									if ext in image_mime_types:
										parts[i] = 'data:%s;base64,%s%s' % (image_mime_types[ext], base64.b64encode(open(img_path,'rb').read()), parts[i][j:])
					splash_css = 'url('.join(parts)

		# build the titanium.css file
		print '[INFO] Assembling titanium.css...'
		ti_css = HEADER + '\n' + splash_css + '\n' + codecs.open(os.path.join(self.themes_path, 'common.css'), 'r', 'utf-8').read()
		
		# TODO: need to rewrite absolute paths for urls
		
		# TODO: code below does NOT inline imports, nor remove them... do NOT use imports until themes are fleshed out
		
		if len(theme):
			theme_path = os.path.join(self.resources_path, 'themes', theme)
			if not os.path.exists(theme_path):
				theme_path = os.path.join(self.resources_path, theme)
			if not os.path.exists(theme_path):
				theme_path = os.path.join(self.themes_path, theme)
			if not os.path.exists(theme_path):
				print '[ERROR] Unable to locate theme "%s"' % theme
			else:
				for dirname, dirnames, filenames in os.walk(theme_path):
					for filename in filenames:
						fname, ext = os.path.splitext(filename.lower())
						if ext == '.css':
							ti_css += codecs.open(os.path.join(dirname, filename), 'r', 'utf-8').read()
		
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
			ti_css += '@font-face{font-family:%s;src:url(%s);}\n' % (font, '),url('.join(fonts[font]))
		
		# minify the css
		if self.minify:
			ti_css = CSSPacker(ti_css).pack()
		
		# write the titanium.css
		ti_css_file = codecs.open(os.path.join(self.build_path, 'titanium.css'), 'w', 'utf-8')
		ti_css_file.write(ti_css)
		ti_css_file.close()
		
		# minify all javascript, html, and css files
		if self.minify:
			# TODO: only minify non-project code (i.e. Titanium and Ti+ modules)
			subprocess.call('java -Xms256m -Xmx256m -cp "%s%s%s" -Djava.awt.headless=true minify "%s"' % (os.path.join(self.sdk_path, 'minify'), os.pathsep, os.path.join(self.sdk_path, 'closureCompiler', 'compiler.jar'), self.build_path), shell=True)
			# elif ext == '.json':
			#	TODO: minify json
			# elif ext == '.css':
			#	TODO: minify css
			# elif ext == '.html':
			#	TODO: minify html
		
		# create the favicon and apple touch icons
		icon_file = os.path.join(self.resources_path, tiapp_xml['icon'])
		fname, ext = os.path.splitext(icon_file.lower())
		if os.path.exists(icon_file) and (ext == '.png' or ext == '.jpg' or ext == '.gif'):
			self.build_icons(icon_file)
		else:
			icon_file = os.path.join(self.resources_path, 'mobileweb', 'appicon.png')
			if os.path.exists(icon_file):
				self.build_icons(icon_file)
		
		# create the filesystem registry
		print '[INFO] Building filesystem registry...'
		filesystem_registry = 'ts\t' + str(int(os.path.getctime(self.build_path)) * 1000) + '\n' + self.walk_fs(self.build_path, 0)
		filesystem_registry_file = codecs.open(os.path.join(self.build_path, 'titanium', 'filesystem.registry'), 'w', 'utf-8')
		filesystem_registry_file.write(filesystem_registry)
		filesystem_registry_file.close()
		
		# if we're preloading the filesystem registry, write it to the require cache
		if tiapp_xml['mobileweb']['filesystem']['registry'] == 'preload':
			ti_js = codecs.open(self.ti_js_file, 'a', 'utf-8')
			ti_js.write('require.cache({"url:/titanium/filesystem.registry":"' + filesystem_registry.strip().replace('\n', '|') + '"});')
			ti_js.close()
		
		# get status bar style
		status_bar_style = 'default'
		if 'statusbar-style' in tiapp_xml:
			status_bar_style = tiapp_xml['statusbar-style']
			if status_bar_style == 'opaque_black' or status_bar_style == 'opaque':
				status_bar_style = 'black'
			elif status_bar_style == 'translucent_black' or status_bar_style == 'transparent' or status_bar_style == 'translucent':
				status_bar_style = 'black-translucent'
			else:
				status_bar_style = 'default'
		
		# populate index.html
		index_html_file = codecs.open(os.path.join(self.build_path, 'index.html'), 'w', 'utf-8')
		index_html_file.write(AppcTemplate(codecs.open(os.path.join(self.sdk_src_path, 'index.html'), 'r', 'utf-8').read().strip(), input_encoding='utf-8', output_encoding='utf-8').render(
			ti_header          = HTML_HEADER,
			project_name       = tiapp_xml['name'] or '',
			app_description    = tiapp_xml['description'] or '',
			app_publisher      = tiapp_xml['publisher'] or '',
			splash_screen      = splash_html,
			ti_generator       = 'Appcelerator Titanium Mobile ' + sdk_version,
			ti_statusbar_style = status_bar_style,
			ti_css             = ti_css,
			ti_js              = codecs.open(self.ti_js_file, 'r', 'utf-8').read()
		))
		index_html_file.close()
		
		total_time = round(time.time() - start_time)
		total_minutes = math.floor(total_time / 60)
		total_seconds = total_time % 60
		if total_minutes > 0:
			print '[INFO] Finished in %s minutes %s seconds' % (int(total_minutes), int(total_seconds))
		else:
			print '[INFO] Finished in %s seconds' % int(total_time)
	
	def load_i18n(self, xml_file):
		if not os.path.exists(xml_file):
			return None
		
		strings = {}
		dom = parseString(codecs.open(xml_file, 'r', 'utf-8', 'replace').read().encode('utf-8'))
		root = dom.documentElement
		
		for node in root.childNodes:
			if node.nodeType == 1 and node.nodeName == 'string':
				name = node.getAttribute('name')
				if name is not '':
					val = ''
					for inner in node.childNodes:
						if inner.nodeType == node.TEXT_NODE:
							val = val + inner.data
					strings[name] = val.encode('utf-8').decode('string-escape').strip()
		
		return strings
	
	def walk_fs(self, path, depth):
		s = ''
		listing = os.listdir(path)
		listing.sort()
		for file in listing:
			p = os.path.join(path, file)
			# TODO: screen out specific file/folder patterns (i.e. uncompressed js files)
			if os.path.isdir(p):
				s += ('\t' * depth) + file + '\n' + self.walk_fs(p, depth + 1)
			else:
				s += ('\t' * depth) + file + '\t' + str(os.path.getsize(p)) + '\n'
		return s
	
	def resolve(self, it, ref):
		parts = it.split('!')
		it = parts[-1]
		if it.startswith('url:'):
			it = it[4:]
			if it.startswith('/'):
				it = '.' + it
			parts = it.split('/')
			for p in self.packages:
				if p['name'] == parts[0]:
					return [self.compact_path(os.path.join(self.build_path, p['location'])), it]
			return [self.build_path, it]
		if it.find(':') != -1:
			return []
		if it.startswith('/') or (len(parts) == 1 and it.endswith('.js')):
			return [self.build_path, it]
		if it.startswith('.') and ref is not None:
			it = self.compact_path(ref + it)
		parts = it.split('/')
		for p in self.packages:
			if p['name'] == parts[0]:
				if p['name'] != 'Ti':
					it = it.replace(p['name'] + '/', '')
				return [self.compact_path(os.path.join(self.build_path, p['location'])), it]
		return [self.build_path, it]
	
	def copy(self, src_path, dest_path, ignore=None):
		if os.path.exists(src_path):
			print '[INFO] Copying %s...' % src_path
			if os.path.isdir(src_path):
				for root, dirs, files in os.walk(src_path):
					for name in ignoreDirs:
						if name in dirs:
							dirs.remove(name)
					if ignore is not None and root == src_path:
						for name in ignore:
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
			else:
				shutil.copy(src_path, dest_path)
	
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
		print '[INFO] Generating app icons...'
		favicon = os.path.join(self.build_path, 'favicon.png')
		s = 'java -Xms256m -Xmx256m -cp "%s%s%s" -Dquiet=true -Djava.awt.headless=true resize "%s"' % (os.path.join(self.sdk_path, 'imageResizer'), os.pathsep, os.path.join(self.sdk_path, 'imageResizer', 'imgscalr-lib-4.2.jar'), src)
		s += ' "%s" %d %d' % (favicon, 16, 16)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-precomposed.png'), 57, 57)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-57x57-precomposed.png'), 57, 57)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-72x72-precomposed.png'), 72, 72)
		s += ' "%s" %d %d' % (os.path.join(self.build_path, 'apple-touch-icon-114x114-precomposed.png'), 114, 114)
		subprocess.call(s, shell=True)
		os.rename(favicon, os.path.join(self.build_path, 'favicon.ico'))
	
	def load_package_json(self):
		package_json_file = os.path.join(self.ti_package_path, 'package.json')
		if not os.path.exists(package_json_file):
			print '[ERROR] Unable to open titanium package manifest "%s"' % package_json_file
			sys.exit(1)
		self.package_json = simplejson.load(codecs.open(package_json_file, 'r', 'utf-8'))
	
	def locate_module(self, path):
		module_dir = None
		module_version = '0.0.0'
		if os.path.exists(path):
			for dir in os.listdir(path):
				mdir = os.path.join(path, dir)
				if os.path.isdir(mdir) and compare_versions(module_version, dir) == -1:
					module_version = dir
					module_dir = mdir
		return module_dir
	
	def find_project_dependencies(self):
		print '[INFO] Scanning project for dependencies...'
		
		# TODO: using an AST, scan the entire project's source and identify all dependencies
		self.project_dependencies += [
			'Ti',
			'Ti/Accelerometer',
			'Ti/Analytics',
			'Ti/API',
			'Ti/App',
			'Ti/App/Properties',
			'Ti/Blob',
			'Ti/Buffer',
			'Ti/Codec',
			'Ti/Facebook',
			'Ti/Facebook/LoginButton',
			'Ti/Filesystem',
			'Ti/Filesystem/File',
			'Ti/Filesystem/FileStream',
			'Ti/Gesture',
			'Ti/_/Gestures/GestureRecognizer',
			'Ti/_/Gestures/Dragging',
			'Ti/_/Gestures/DoubleTap',
			'Ti/_/Gestures/LongPress',
			'Ti/_/Gestures/Pinch',
			'Ti/_/Gestures/SingleTap',
			'Ti/_/Gestures/Swipe',
			'Ti/_/Gestures/TouchCancel',
			'Ti/_/Gestures/TouchEnd',
			'Ti/_/Gestures/TouchMove',
			'Ti/_/Gestures/TouchStart',
			'Ti/_/Gestures/TwoFingerTap',
			'Ti/Geolocation',
			'Ti/IOStream',
			'Ti/Locale',
			'Ti/Media',
			'Ti/Media/VideoPlayer',
			'Ti/Network',
			'Ti/Network/HTTPClient',
			'Ti/Platform',
			'Ti/Platform/DisplayCaps',
			'Ti/Map',
			'Ti/Map/View',
			'Ti/Map/Annotation',
			'Ti/UI',
			'Ti/UI/2DMatrix',
			'Ti/UI/ActivityIndicator',
			'Ti/UI/AlertDialog',
			'Ti/UI/Animation',
			'Ti/UI/Button',
			'Ti/UI/Clipboard',
			'Ti/UI/EmailDialog',
			'Ti/UI/ImageView',
			'Ti/UI/Label',
			'Ti/UI/MobileWeb',
			'Ti/UI/MobileWeb/NavigationGroup',
			'Ti/UI/OptionDialog',
			'Ti/UI/Picker',
			'Ti/UI/PickerColumn',
			'Ti/UI/PickerRow',
			'Ti/UI/ProgressBar',
			'Ti/UI/ScrollableView',
			'Ti/UI/ScrollView',
			'Ti/UI/Slider',
			'Ti/UI/Switch',
			'Ti/UI/Tab',
			'Ti/UI/TabGroup',
			'Ti/UI/TableView',
			'Ti/UI/TableViewRow',
			'Ti/UI/TableViewSection',
			'Ti/UI/TextArea',
			'Ti/UI/TextField',
			'Ti/UI/View',
			'Ti/UI/WebView',
			'Ti/UI/Window',
			'Ti/Utils',
			'Ti/XML',
			'Ti/Yahoo'
		]
	
	def parse_deps(self, deps):
		found = []
		if len(deps) > 2:
			deps = deps[1:-1]
			deps = deps.split(',')
			for dep in deps:
				dep = dep.strip().split(' ')[0].strip()
				if dep.startswith('\'') or dep.startswith('"'):
					found.append(simplejson.loads(dep))
		return found
	
	def find_modules_to_cache(self):
		print '[INFO] Searching for all required modules...'
		
		self.require_cache = {}
		
		for module in self.project_dependencies:
			self.parse_module(module, None)
		
		self.modules_to_cache = []
		for module in self.require_cache:
			self.modules_to_cache.append(module)
	
	def parse_module(self, module, ref):
		if module in self.require_cache or module == 'require':
			return
		
		parts = module.split('!')
		
		if len(parts) == 1:
			if module.startswith('.') and ref is not None:
				module = self.compact_path(ref + module)
			self.require_cache[module] = 1
		
		dep = self.resolve(module, ref)
		if not len(dep):
			return
		
		if len(parts) > 1:
			self.require_cache['url:' + parts[1]] = 1
		
		filename = dep[1]
		if not filename.endswith('.js'):
			filename += '.js'
		
		source = codecs.open(os.path.join(dep[0], filename), 'r', 'utf-8').read()
		pattern = re.compile('define\(\s*([\'\"][^\'\"]*[\'\"]\s*)?,?\s*(\[[^\]]+\])\s*?,?\s*(function|\{)')
		results = pattern.search(source)
		if results is None:
			self.modules_map[module] = []
		else:
			groups = results.groups()
			if groups is not None and len(groups):
				if groups[1] is None:
					self.modules_map[module] = []
				else:
					deps = self.parse_deps(groups[1])
					for i in range(0, len(deps)):
						dep = deps[i]
						parts = dep.split('!')
						ref = module.split('/')
						ref.pop()
						ref = '/'.join(ref) + '/'
						if dep.startswith('.'):
							deps[i] = self.compact_path(ref + dep)
						if len(parts) == 1:
							if dep.startswith('./'):
								parts = module.split('/')
								parts.pop()
								parts.append(dep)
								self.parse_module(self.compact_path('/'.join(parts)), ref)
							else:
								self.parse_module(dep, ref)
						else:
							self.modules_map[dep] = parts[0]
							self.parse_module(parts[0], module)
							if parts[0] == 'Ti/_/text':
								if dep.startswith('./'):
									parts = module.split('/')
									parts.pop()
									parts.append(dep)
									self.parse_module(self.compact_path('/'.join(parts)), ref)
								else:
									self.parse_module(dep, ref)
					self.modules_map[module] = deps
