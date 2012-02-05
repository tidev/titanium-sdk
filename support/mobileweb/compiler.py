#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Project Compiler
#

import os, sys, time, datetime, simplejson, codecs, shutil
from tiapp import *
#re, base64, sgmllib, xml

#try:
#	import Image
#except:
#	print "\nERROR: Unabled to import module \"Image\"\n"
#	print "Run `sudo easy_install pil` to install the 'Image' module or download from http://www.pythonware.com/products/pil/\n"
#	sys.exit(1)

# Add the Android support dir, since mako is located there, and import mako
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'android')))
#import mako.template
#import simplejson as json
#import tiapp
#

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

FOOTER = """"""

class Compiler(object):

	def __init__(self, project_path, deploytype):
		
		start_time = time.time()
		packages = []
		dependencies = []
		
		# initialize paths
		self.sdk_path = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.sdk_src_path = os.path.join(self.sdk_path, 'src')
		self.modules_path = os.path.abspath(os.path.join(self.sdk_path, '../../../../modules/mobileweb'))
		self.project_path = project_path
		self.build_path = os.path.join(project_path, 'build', 'mobileweb')
		self.resources_path = os.path.join(project_path, 'Resources')
		
		sdk_version = os.path.basename(os.path.abspath(os.path.join(self.sdk_path, '../')))
		print '[INFO] Titanium Mobile Web Compiler v%s' % sdk_version
		
		# read the package.json
		package_json_file = os.path.join(self.sdk_path, 'titanium', 'package.json')
		if not os.path.exists(package_json_file):
			print '[ERROR] Unable to open titanium package manifest "%s"' % package_json_file
			sys.exit(1)
		package_json = simplejson.load(codecs.open(package_json_file, 'r', 'utf-8'))
		
		# register the titanium package
		packages.append({
			'name': package_json['name'],
			'location': './titanium',
			'main': './' + self.compactPath('./titanium/' + package_json['main'] + '.js')
		})
		
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
					if not main_file.endswith('.js'):
						main_file += '.js'
					main_file_path = os.path.join(module_dir, main_file)
					
					if not os.path.exists(main_file_path):
						print '[ERROR] Ti+ module "%s" is invalid: missing main "%s"' % (module['id'], main_file)
						sys.exit(1)
					
					dependencies.append(main_file_path)
					
					packages.append({
						'name': module['id'],
						'location': './modules/' + module['id'],
						'main': './' + self.compactPath('./modules/' + module['id'] + '/' + module_package_json['main'] + '.js')
					})
					
					print '[INFO] Bundling Ti+ module "%s"' % module['id']
					
					# TODO: need to combine ALL Ti+ module .js files into the titanium.js, not just the main file
					
					# TODO: need to combine ALL Ti+ module .css files into the titanium.css
					
					# copy entire module directory to build directory
					shutil.copytree(module_dir, os.path.join(self.build_path, 'modules', module['id']))
		
		# scan project for dependencies
		print '[INFO] Scanning project for dependencies...'
		# TODO: scan the entire project's source and identify all dependencies
		dependencies += [
			# these MUST be ordered correctly!
			
			# building blocks
			self.sdk_src_path + 'Ti/_',
			self.sdk_src_path + 'Ti/_/browser.js',
			self.sdk_src_path + 'Ti/_/css.js',
			self.sdk_src_path + 'Ti/_/declare.js',
			self.sdk_src_path + 'Ti/_/dom.js',
			self.sdk_src_path + 'Ti/_/event.js',
			self.sdk_src_path + 'Ti/_/lang.js',
			self.sdk_src_path + 'Ti/_/ready.js',
			self.sdk_src_path + 'Ti/_/string.js',
			self.sdk_src_path + 'Ti/_/style.js',
			
			# AMD plugins
			self.sdk_src_path + 'Ti/_/include.js',
			self.sdk_src_path + 'Ti/_/text.js',
			
			# base classes
			self.sdk_src_path + 'Ti/_/Evented.js',
			self.sdk_src_path + 'Ti/UI.js',
			self.sdk_src_path + 'Ti/_/Gestures/GestureRecognizer.js',
			self.sdk_src_path + 'Ti/_/Gestures/DoubleTap.js',
			self.sdk_src_path + 'Ti/_/Gestures/LongPress.js',
			self.sdk_src_path + 'Ti/_/Gestures/Pinch.js',
			self.sdk_src_path + 'Ti/_/Gestures/SingleTap.js',
			self.sdk_src_path + 'Ti/_/Gestures/Swipe.js',
			self.sdk_src_path + 'Ti/_/Gestures/TouchStart.js',
			self.sdk_src_path + 'Ti/_/Gestures/TouchMove.js',
			self.sdk_src_path + 'Ti/_/Gestures/TouchEnd.js',
			self.sdk_src_path + 'Ti/_/Gestures/TouchCancel.js',
			self.sdk_src_path + 'Ti/_/Gestures/TwoFingerTap.js',
			self.sdk_src_path + 'Ti/_/UI/Element.js',
			self.sdk_src_path + 'Ti/_/Layouts/Base.js',
			self.sdk_src_path + 'Ti/_/Layouts/Absolute.js',
			self.sdk_src_path + 'Ti/_/Layouts/Horizontal.js',
			self.sdk_src_path + 'Ti/_/Layouts/Vertical.js',
			self.sdk_src_path + 'Ti/_/Layouts.js',
			
			# core classes
			self.sdk_src_path + 'Ti/ti.js',
			self.sdk_src_path + 'Ti/Accelerometer.js',
			self.sdk_src_path + 'Ti/Analytics.js',
			self.sdk_src_path + 'Ti/API.js',
			self.sdk_src_path + 'Ti/App.js',
			self.sdk_src_path + 'Ti/App/Properties.js',
			self.sdk_src_path + 'Ti/Blob.js',
			self.sdk_src_path + 'Ti/Contacts.js',
			self.sdk_src_path + 'Ti/Database.js',
			self.sdk_src_path + 'Ti/Facebook.js',
			self.sdk_src_path + 'Ti/Filesystem.js',
			self.sdk_src_path + 'Ti/Geolocation.js',
			self.sdk_src_path + 'Ti/Locale.js',
			self.sdk_src_path + 'Ti/Map.js',
			self.sdk_src_path + 'Ti/Media.js',
			self.sdk_src_path + 'Ti/Network.js',
			self.sdk_src_path + 'Ti/Network/HTTPClient.js',
			self.sdk_src_path + 'Ti/Platform.js',
			self.sdk_src_path + 'Ti/Platform/DisplayCaps.js',
			self.sdk_src_path + 'Ti/Gesture.js',
			self.sdk_src_path + 'Ti/XML.js',
			
			# UI constants
			self.sdk_src_path + 'Ti/UI/MobileWeb/TableViewSeparatorStyle.js',
			
			# View classes
			self.sdk_src_path + 'Ti/UI/View.js',
			self.sdk_src_path + 'Ti/Media/VideoPlayer.js',
			self.sdk_src_path + 'Ti/UI/TableViewRow.js',
			
			# SuperView classes
			self.sdk_src_path + 'Ti/_/UI/SuperView.js',
			self.sdk_src_path + 'Ti/UI/Tab.js',
			self.sdk_src_path + 'Ti/UI/TabGroup.js',
			self.sdk_src_path + 'Ti/UI/Window.js',
			
			# Widget classes
			self.sdk_src_path + 'Ti/_/UI/Widget.js',
			self.sdk_src_path + 'Ti/_/UI/FontWidget.js',
			self.sdk_src_path + 'Ti/_/UI/TextBox.js',
			self.sdk_src_path + 'Ti/UI/2DMatrix.js',
			self.sdk_src_path + 'Ti/UI/ActivityIndicator.js',
			self.sdk_src_path + 'Ti/UI/AlertDialog.js',
			self.sdk_src_path + 'Ti/UI/Animation.js',
			self.sdk_src_path + 'Ti/UI/Button.js',
			self.sdk_src_path + 'Ti/UI/ImageView.js',
			self.sdk_src_path + 'Ti/UI/Label.js',
			self.sdk_src_path + 'Ti/UI/ScrollableView.js',
			self.sdk_src_path + 'Ti/UI/ScrollView.js',
			self.sdk_src_path + 'Ti/UI/Slider.js',
			self.sdk_src_path + 'Ti/UI/Switch.js',
			self.sdk_src_path + 'Ti/UI/TableViewSection.js',
			self.sdk_src_path + 'Ti/UI/TableView.js',
			self.sdk_src_path + 'Ti/UI/TextArea.js',
			self.sdk_src_path + 'Ti/UI/TextField.js',
			self.sdk_src_path + 'Ti/UI/WebView.js',
			self.sdk_src_path + 'Ti/Utils.js'
		]
		
		print '[INFO] Found %s dependenc%s' % (len(dependencies), 'y' if len(dependencies) == 1 else 'ies')
		
		# TODO: break up the dependencies into layers
		
		
		print packages
		
		
		
		total_time = time.time() - start_time
		total_seconds = int(round(total_time % 60))
		print '[INFO] Finished in %s seconds' % total_seconds
	
	def compactPath(self, path):
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
	
	def crap(self):
		self.debug = True # temporarily forcing debug (i.e. development) mode until jsmin is replaced
		self.count = 0
		
		if deploytype == 'development' or deploytype == 'all':
			self.debug = True

		
		
		self.project_name = ti.properties['name']
		self.appid = ti.properties['id']
		
		source = self.resources_dir
		target = self.build_dir

		for root, dirs, files in os.walk(source):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories
			for file in files:
				if file in ignoreFiles:
					continue
				from_ = os.path.join(root, file)
				to_ = os.path.expanduser(from_.replace(source, target, 1))
				to_directory = os.path.expanduser(os.path.split(to_)[0])
				if not os.path.exists(to_directory):
					try:
						os.makedirs(to_directory)
					except:
						pass
				fp = os.path.splitext(file)
				if fp[1]=='.js':
					self.count+=1
				#	compile_js(from_,to_)
				#else:
				shutil.copy(from_,to_)
		
		# TODO: need to add all Ti+ modules to the "packages" config option
		titanium_js = mako.template.Template("<%!\n\
	def jsQuoteEscapeFilter(str):\n\
		return str.replace(\"\\\"\",\"\\\\\\\"\")\n\
%>\n" + "var require={\n\
	analytics: ${app_analytics | jsQuoteEscapeFilter},\n\
	app: {\n\
		copyright: \"${app_copyright | jsQuoteEscapeFilter}\",\n\
		description: \"${app_description | jsQuoteEscapeFilter}\",\n\
		guid: \"${app_guid | jsQuoteEscapeFilter}\",\n\
		id: \"${app_name | jsQuoteEscapeFilter}\",\n\
		name: \"${app_name | jsQuoteEscapeFilter}\",\n\
		publisher: \"${app_publisher | jsQuoteEscapeFilter}\",\n\
		url: \"${app_url | jsQuoteEscapeFilter}\",\n\
		version: \"${app_version | jsQuoteEscapeFilter}\"\n\
	},\n\
	deployType: \"${deploy_type | jsQuoteEscapeFilter}\",\n\
	has: {\n\
		\"declare-property-methods\": true\n\
	},\n\
	project: {\n\
		id: \"${project_id | jsQuoteEscapeFilter}\",\n\
		name: \"${project_name | jsQuoteEscapeFilter}\"\n\
	},\n\
	ti: {\n\
		version: \"${ti_version | jsQuoteEscapeFilter}\"\n\
	},\n\
	vendorPrefixes: {\n\
		css: [\"\", \"-webkit-\", \"-moz-\", \"-ms-\", \"-o-\", \"-khtml-\"],\n\
		dom: [\"\", \"Webkit\", \"Moz\", \"ms\", \"O\", \"Khtml\"]\n\
	}\n\
};\n".encode('utf-8')).render(
				project_name=self.project_name,
				project_id=self.appid,
				deploy_type=deploytype,
				app_id=self.appid,
				app_analytics='true' if ti.properties['analytics']=='true' else 'false',
				app_publisher=ti.properties['publisher'],
				app_url=ti.properties['url'],
				app_name=ti.properties['name'],
				app_version=ti.properties['version'],
				app_description=ti.properties['description'],
				app_copyright=ti.properties['copyright'],
				app_guid=ti.properties['guid'],
				ti_version=sdk_version
			) + self.load_api(os.path.join(self.sdk_src_path,"loader.js")) + self.load_api(os.path.join(self.sdk_src_path,"titanium.js"))
		
		if deploytype == 'all':
			print "Deploy type is 'all' - all modules will be included into dist"
			for root, dirs, files in os.walk(self.sdk_src_path):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)	# don't visit ignored directories
				for file in files:
					if file in ignoreFiles or file == 'titanium.js':
						continue
					path = os.path.join(root, file)
					fp = os.path.splitext(file)
					if fp[1]=='.js':
						(path, fname) = os.path.split(path)
						(path, ddir) = os.path.split(path)
						if ddir != 'src':
							fname = ddir + "/" + fname
						try:
							dependencies.index(fname)
						except:
							dependencies.append(fname)
		
		titanium_css = ''
		
		try:
			shutil.rmtree(os.path.join(self.build_dir, 'Ti'))
		except:
			pass
		
		print "Copying %s to %s" % (os.path.join(self.sdk_src_path, 'Ti'), self.build_dir)
		shutil.copytree(os.path.join(self.sdk_src_path, 'Ti'), os.path.join(self.build_dir, 'Ti'))
		
		# append together all dependencies
		for api in dependencies:
			api_file = os.path.join(self.sdk_src_path,api)
			if not os.path.exists(api_file):
				print "[ERROR] Couldn't find file: %s" % api_file
				sys.exit(1)
			else:
#				print "[DEBUG] Found: %s" % api_file
				
				dest = os.path.join(self.build_dir, api)
				try:
					os.makedirs(os.path.dirname(dest))
				except:
					pass
				shutil.copy(api_file, dest)
				
				if api_file.find('.js') != -1:
					# TODO: it would be nice to detect if we *need* to add a ;
					titanium_js += '%s;\n' % self.load_api(api_file, api)
				elif api_file.find('.css') != -1:
					titanium_css += '%s\n\n' % self.load_api(api_file, api)
				else:
					print 'WARNING: Dependency "%s" is not a JavaScript or CSS file, skipping' % api_file
					#target_file = os.path.abspath(os.path.join(self.build_dir,'titanium', api))
					#try:
					#	os.makedirs(os.path.dirname(target_file))
					#except:
					#	pass
					#shutil.copy(api_file, target_file)
		
		# copy the favicon
		icon_file = os.path.join(self.resources_dir, ti.properties['icon'])
		fname, ext = os.path.splitext(icon_file)
		ext = ext.lower()
		if os.path.exists(icon_file) and (ext == '.png' or ext == '.jpg' or ext == '.gif'):
			self.build_icons(icon_file)
		else:
			icon_file = os.path.join(self.resources_dir, 'mobileweb', 'appicon.png')
			if os.path.exists(icon_file):
				self.build_icons(icon_file)
		
		if len(ti.app_properties):
			titanium_js += '(function(p){'
			
			for name in ti.app_properties:
				prop = ti.app_properties[name]
				
				if prop['type'] == 'bool':
					titanium_js += 'p.setBool("' + name + '",' + prop['value'] + ');'
				elif prop['type'] == 'int':
					titanium_js += 'p.setInt("' + name + '",' + prop['value'] + ');'
				elif prop['type'] == 'double':
					titanium_js += 'p.setDouble("' + name + '",' + prop['value'] + ');'
				else:
					titanium_js += 'p.setString("' + name + '","' + str(prop['value']).replace('"', '\\"') + '");'
			
			titanium_js += '}(Ti.App.Properties));'
		
#		o = codecs.open(os.path.join(ti_dir,'titanium.js'),'w',encoding='utf-8')
#		o.write(HEADER + titanium_js + FOOTER)
#		o.close()
		
		# detect any fonts and add font face rules to the css file
		resource_dir = os.path.join(project_dir, 'Resources')
		fonts = {}
		for dirname, dirnames, filenames in os.walk(resource_dir):
			for filename in filenames:
				fname, ext = os.path.splitext(filename)
				ext = ext.lower()
				if ext == '.otf' or ext == '.woff':
					if not fname in fonts:
						fonts[fname] = []
					fonts[fname].append(os.path.join(dirname, filename)[len(resource_dir):])
		for font in fonts:
			titanium_css += "@font-face{font-family:%s;src:url(%s);}\n" % (font, "),url(".join(fonts[font]))
		
#		o = codecs.open(os.path.join(ti_dir,'titanium.css'), 'w', encoding='utf-8')
#		o.write(HEADER + titanium_css + 'end' + FOOTER)
#		o.close()

		try:
			status_bar_style = ti.properties['statusbar-style']
			
			if status_bar_style == 'default' or status_bar_style=='grey':
				status_bar_style = 'default'
			elif status_bar_style == 'opaque_black' or status_bar_style == 'opaque' or status_bar_style == 'black':
				status_bar_style = 'black'
			elif status_bar_style == 'translucent_black' or status_bar_style == 'transparent' or status_bar_style == 'translucent':
				status_bar_style = 'black-translucent'
			else:	
				status_bar_style = 'default'
		except:
			status_bar_style = 'default'

		main_template = codecs.open(os.path.join(self.sdk_src_path,'index.html'), encoding='utf-8').read().encode("utf-8")
		main_template = mako.template.Template(main_template).render(
				ti_version=sdk_version,
				ti_statusbar_style=status_bar_style,
				ti_generator="Appcelerator Titanium Mobile "+sdk_version,
				project_name=self.project_name,
				project_id=self.appid,
				deploy_type=deploytype,
				app_id=self.appid,
				app_analytics=ti.properties['analytics'],
				app_publisher=ti.properties['publisher'],
				app_url=ti.properties['url'],
				app_name=ti.properties['name'],
				app_version=ti.properties['version'],
				app_description=ti.properties['description'],
				app_copyright=ti.properties['copyright'],
				app_guid=ti.properties['guid'],
				ti_header=HTML_HEADER,
				ti_css=titanium_css,
				ti_js=titanium_js)

		index_file = os.path.join(self.build_dir,'index.html')
		o = codecs.open(index_file,'w',encoding='utf-8')
		o.write(main_template)
		o.close()
		
		# Copy the themes
		shutil.copytree(os.path.join(sdk_dir,'themes'),os.path.join(self.build_dir,'themes'))
		
		print "[INFO] Compiled %d files for %s" % (self.count,ti.properties['name'])
	
	def build_icon(self, src, filename, size):
		img = Image.open(src)
		resized = img.resize((size, size), Image.ANTIALIAS)
		resized.save(os.path.join(self.build_dir, filename), 'png')
		
	def build_icons(self, src):
		self.build_icon(src, 'favicon.ico', 16)
		self.build_icon(src, 'apple-touch-icon-precomposed.png', 57)
		self.build_icon(src, 'apple-touch-icon-57x57-precomposed.png', 57)
		self.build_icon(src, 'apple-touch-icon-72x72-precomposed.png', 72)
		self.build_icon(src, 'apple-touch-icon-114x114-precomposed.png', 114)
	
	def load_api(self,file, api=""):
		file_contents = codecs.open(file, 'r', 'utf-8').read()
		if not self.debug and file.find('.js') != -1:
			return jspacker.jsmin(file_contents)
		elif file.find('.css') != -1:
			# need to replace urls to add directory prefix into path
			return re.sub(r'(url\s*\([\'"]?)', r'\1' + os.path.split(api)[0] + '/', file_contents)
		else:
			return file_contents
