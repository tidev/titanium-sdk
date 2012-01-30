#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Project Compiler
#

import os, sys, re, shutil, time, base64, sgmllib, codecs, xml, datetime

try:
	import Image
except:
	print "\nERROR: Unabled to import module \"Image\"\n"
	print "Run `sudo easy_install pil` to install the 'Image' module or download from http://www.pythonware.com/products/pil/\n"
	sys.exit(1)

# Add the Android support dir, since mako is located there, and import mako
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..", "android")))
import mako.template
import simplejson as json

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
from tiapp import *
import jspacker 

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
	def __init__(self,project_dir,deploytype):
		self.project_dir = project_dir

#		self.modules = []

		self.defines = [
				# these MUST be ordered correctly!
				'eventdriven.js',

				# building blocks
				'Ti/_/String.js',

				# AMD plugins
				"Ti/_/include.js",
				"Ti/_/text.js",

				# base classes
				'Ti/_/Evented.js',
				'Ti/UI.js',
				'Ti/_/Gestures/GestureRecognizer.js',
				'Ti/_/Gestures/DoubleTap.js',
				'Ti/_/Gestures/LongPress.js',
				'Ti/_/Gestures/Pinch.js',
				'Ti/_/Gestures/SingleTap.js',
				'Ti/_/Gestures/Swipe.js',
				'Ti/_/Gestures/TouchStart.js',
				'Ti/_/Gestures/TouchMove.js',
				'Ti/_/Gestures/TouchEnd.js',
				'Ti/_/Gestures/TouchCancel.js',
				'Ti/_/Gestures/TwoFingerTap.js',
				'Ti/_/UI/Element.js',
				'Ti/_/Layouts/Base.js',
				'Ti/_/Layouts/Absolute.js',
				'Ti/_/Layouts/Horizontal.js',
				'Ti/_/Layouts/Vertical.js',
				'Ti/_/Layouts.js',
				
				# core classes
				'Ti/ti.js',
				'Ti/Accelerometer.js',
				'Ti/Analytics.js',
				'Ti/API.js',
				'Ti/App.js',
				'Ti/App/Properties.js',
				'Ti/Blob.js',
				'Ti/Contacts.js',
				'Ti/Database.js',
				'Ti/Facebook.js',
				'Ti/Filesystem.js',
				'Ti/Geolocation.js',
				'Ti/Locale.js',
				'Ti/Map.js',
				'Ti/Media.js',
				'Ti/Network.js',
				'Ti/Network/HTTPClient.js',
				'Ti/Platform.js',
				'Ti/Platform/DisplayCaps.js',
				'Ti/Gesture.js',
				'Ti/XML.js',
				
				# UI Constants
				'Ti/UI/MobileWeb/TableViewSeparatorStyle.js',
				
				# View classes
				'Ti/UI/View.js',
				'Ti/Media/VideoPlayer.js',
				'Ti/UI/TableViewRow.js',
				
				# SuperView classes
				'Ti/_/UI/SuperView.js',
				'Ti/UI/Tab.js',
				'Ti/UI/TabGroup.js',
				'Ti/UI/Window.js',
				
				# Widget classes
				'Ti/_/UI/Widget.js',
				'Ti/_/UI/FontWidget.js',
				'Ti/_/UI/TextBox.js',
				'Ti/UI/2DMatrix.js',
				'Ti/UI/ActivityIndicator.js',
				'Ti/UI/AlertDialog.js',
				'Ti/UI/Animation.js',
				'Ti/UI/Button.js',
				'Ti/UI/ImageView.js',
				'Ti/UI/Label.js',
				'Ti/UI/ScrollableView.js',
				'Ti/UI/ScrollView.js',
				'Ti/UI/Slider.js',
				'Ti/UI/Switch.js',
				'Ti/UI/TableViewSection.js',
				'Ti/UI/TableView.js',
				'Ti/UI/TextArea.js',
				'Ti/UI/TextField.js',
				'Ti/UI/WebView.js',
				'Ti/Utils.js',
				
				# resources
				'titanium.css'
			]
		
#		self.css_defines = []
#		self.ti_includes = {}
#		self.api_map = {}
		
		self.build_dir = os.path.join(self.project_dir,'build','mobileweb')
		
		self.resources_dir = os.path.join(self.project_dir,'Resources')
		self.debug = True # temporarily forcing debug (i.e. development) mode until jsmin is replaced
		self.count = 0
		
		if deploytype == 'development' or deploytype == 'all':
			self.debug = True

		src_dir = os.path.join(template_dir,'src')

		if os.path.exists(self.build_dir):
			shutil.rmtree(self.build_dir, True)

		try:
			os.makedirs(self.build_dir)
		except:
			pass
			
		# load up our API map
#		map_props = open(os.path.join(src_dir,'map.prop')).read()
#		for line in map_props.split("\n"):
#			if line[0:1] == '#' or line[0:1]=='': continue
#			key,value = line.split("=")
#			self.api_map[key.strip()]=value.strip().split()

		tiapp_xml = os.path.join(project_dir,'tiapp.xml')
		ti = TiAppXML(tiapp_xml)
		sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))

		self.project_name = ti.properties['name']
		self.appid = ti.properties['id']

# temporarily already being forced, will need to re-enable
#		if ti.properties['analytics']:
#			self.defines.append("Ti.Platform/platform.js")

#		def compile_js(from_,to_):
#			try:
#				js = Compiler.make_function_from_file(from_,self)
#				o = codecs.open(to_,'w',encoding='utf-8')
#				o.write(js)
#				o.close()
#				self.count+=1
#			except:
#				pass

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
			) + self.load_api(os.path.join(src_dir,"loader.js")) + self.load_api(os.path.join(src_dir,"titanium.js"))
		
		if deploytype == 'all':
			print "Deploy type is 'all' - all modules will be included into dist"
			for root, dirs, files in os.walk(src_dir):
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
							self.defines.index(fname)
						except:
							self.defines.append(fname)
		
		titanium_css = ''
		
		try:
			shutil.rmtree(os.path.join(self.build_dir, 'Ti'))
		except:
			pass
		
		print "Copying %s to %s" % (os.path.join(src_dir, 'Ti'), self.build_dir)
		shutil.copytree(os.path.join(src_dir, 'Ti'), os.path.join(self.build_dir, 'Ti'))
		
		for api in self.defines:
			api_file = os.path.join(src_dir,api)
			if not os.path.exists(api_file):
				print "[ERROR] couldn't find file: %s" % api_file
				sys.exit(1)
			else:
				print "[DEBUG] found: %s" % api_file
				
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
					target_file = os.path.abspath(os.path.join(self.build_dir,'titanium', api))
					try:
						os.makedirs(os.path.dirname(target_file))
					except:
						pass
					shutil.copy(api_file, target_file)
					# open(target_file,'wb').write(open(api_file,'rb').read())
		
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
		
#		ti_dir = os.path.join(self.build_dir,'titanium')
#		try:
#			os.makedirs(ti_dir)
#		except:
#			pass
		
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

		main_template = codecs.open(os.path.join(src_dir,'index.html'), encoding='utf-8').read().encode("utf-8")
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

		# write localization data

#		i18n_content = "Titanium._5.setLocaleData("
#		def xml2json(collector, node):
#			collector[node.attributes.items()[0][1]] = node.firstChild.nodeValue
#			return collector
#
#		lang_arr = {}
#		for root, dirs, files in os.walk(os.path.join(self.project_dir,'i18n')):
#			for file in files:
#				if file != 'strings.xml':
#					continue
#				lang = os.path.split(root)[1]
#				lang_arr[lang] = {}
#				lang_file = codecs.open(os.path.join(root, file), 'r', 'utf-8').read().encode("utf-8")
#				dom = xml.dom.minidom.parseString(lang_file)
#				strings = dom.getElementsByTagName("string")
#				reduce(xml2json, strings, lang_arr[lang])
#		i18n_content += json.dumps(lang_arr)
#
#		i18n_content += ");";
#		i18n_file = os.path.join(self.build_dir,'titanium', 'i18n.js')
#		o = codecs.open(i18n_file,'w', encoding='utf-8')
#		o.write(i18n_content)
#		o.close()
		
		# Copy the themes
		shutil.copytree(os.path.join(template_dir,'themes'),os.path.join(self.build_dir,'themes'))
		
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
		
#	def add_symbol(self,api):
#		print "[DEBUG] detected symbol: %s" % api
#		curtoken = ''
#		tokens = api.split(".")
#		if len(tokens) > 1:
#			try:
#				self.modules.index(tokens[0])
#			except:
#				self.modules.append(tokens[0])
#			
#		if self.api_map.has_key(api):
#			for file in self.api_map[api]:
#				if len(tokens) > 1:
#					fn = "Ti.%s/%s" % (tokens[0],file)
#				else:
#					fn = "Ti/%s" % file
#				try:
#					self.defines.index(fn)
#				except:
#					self.defines.append(fn)
#		else:
#			print "[WARN] couldn't find API: %s" % api
#			#sys.exit(1)

#	def extract_tokens(self,sym,line):
#		# sloppy joe parsing coooode
#		# could be prettier and faster but it works and rather reliable
#		c = 0
#		tokens = []
#		search = sym + "."
#		size = len(search)
#		while True:
#			i = line.find(search,c)
#			if i < 0:
#				break
#			found = False
#			buf = ''
#			x = 0
#			for n in line[i+size:]:
#				# look for a terminal - this could probably be easier
#				if n in ['(',')','{','}','=',',',' ',':','!','[',']','+','*','/','~','^','%','\n','\t','\r']:
#					found = True
#					break
#				buf+=n
#				x+=1
#			tokens.append(buf)
#			if found:
#				c = i + x + 1
#				continue
#			break
#		return tokens	

#	def expand_ti_includes(self,line,filename):
#		'''idx = line.find('Ti.include')
#		if idx!=-1:
#			srcs = line[idx+11:-1]
#			for srcQ in srcs.split(','):
#				# remove leading and trailing slashes and spaces
#				src = re.sub(r'\s*([\"\'])([^\1]*)\1[\w\W]*$', r'\2', srcQ, 0, re.M)
#
#				# replace dir separator with platform specific
#				# if first char is / - consider it as absolute to resources dir
#				if src[0] == '/':
#					src_path = os.path.join(self.resources_dir,src[1:len(src)])
#				else:
#					src_path = os.path.join(os.path.dirname(filename),src)
#				# normalize path to match all dir separators
#				src_path = os.path.normpath(src_path)
#
#				if not os.path.exists(src_path):
#					print "[ERROR] Cannot find include file at: %s" % src_path
#					sys.exit(1)
#				source = Compiler.make_function_from_file(src_path,self)
#				self.ti_includes[src] = source'''

#	def compile_js(self,file_contents,fn):
#		contents = ""
#		for line in file_contents.split(';'):
#			self.expand_ti_includes(line,fn)
#			if line == None or line=='' or line == '\n': continue
#			for sym in self.extract_tokens('Ti',line):
#				self.add_symbol(sym)
#			contents+='%s;' % line
#		return contents
	
#	@classmethod
#	def make_function_from_file(cls,file,instance=None):
#		f = os.path.expanduser(file)
#		file_contents = codecs.open(f, 'r', 'utf-8').read()
#		if not instance or not instance.debug:
#			file_contents = jspacker.jsmin(file_contents)
#		file_contents = file_contents.replace('Titanium.','Ti.')
#		if instance:
#			file_contents = instance.compile_js(file_contents, f)
#		return file_contents
