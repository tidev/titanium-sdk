#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Project Compiler
#

import os, sys, re, shutil, time, run, sgmllib, codecs, tempfile, subprocess

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.abspath(os.path.join(template_dir,'..')))
sys.path.append(os.path.abspath(os.path.join(template_dir,'..', 'common')))

from tiapp import *
import jspacker
from csspacker import CSSPacker
import traceback

try:
	import json
except:
	import simplejson as json

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store', '.git','.svn','_svn','CVS'];
ignoreDirs = ['android','mobileweb'];

HEADER = """/**
 * Appcelerator Titanium Mobile
 * This is generated code. Do not modify. Your changes *will* be lost.
 * Generated code is Copyright (c) 2009-2012 by Appcelerator, Inc.
 * All Rights Reserved.
 */
#import <Foundation/Foundation.h>
"""

INTERFACE_HEADER= """
@interface ApplicationRouting : NSObject {
}
+ (NSData*) resolveAppAsset:(NSString*)path;
"""

IMPL_HEADER= """#import "ApplicationRouting.h"

extern NSData* filterDataInRange(NSData* thedata, NSRange range);

@implementation ApplicationRouting

"""

FOOTER ="""
@end
"""

MODULE_IMPL_HEADER = """#import "ApplicationMods.h"

@implementation ApplicationMods

+ (NSArray*) compiledMods
{
	NSMutableArray *modules = [NSMutableArray array];
"""

class HTMLParser(sgmllib.SGMLParser):

    def parse(self, s):
        self.feed(s)
        self.close()

    def __init__(self, verbose=0):
        sgmllib.SGMLParser.__init__(self, verbose)
        self.scripts = []

    def start_script(self, attributes):
        for name, value in attributes:
            if name == "src":
                self.scripts.append(value)

    def get_scripts(self):
        return self.scripts

def read_module_properties(dir):
	file = os.path.join(dir,'manifest')
	dict = {}
	if os.path.exists(file):
		contents = open(file).read()
		for line in contents.splitlines(True):
			if line[0:1]=='#': continue
			idx = line.find(':')
			if idx==-1: continue
			k=line[0:idx]
			v=line[idx+1:].strip()
			dict[k]=v
	return dict

#Convert non-unicode obj to unicode encoded in utf-8.
def to_unicode_or_not(obj, encoding='utf-8'):
	if isinstance(obj, basestring):
		if not isinstance(obj, unicode):
			obj = unicode(obj, encoding)
	return obj

# Need to pre-parse xcconfig files to mangle variable names, and then
# dump them into a map so that we can re-assemble them later
def parse_xcconfig(xcconfig, moduleId, variables):
	module_xcconfig = open(xcconfig)
	new_xcconfig = ''
	local_variables = {}

	prefix = moduleId.upper().replace('.','_')
	for line in module_xcconfig:
		# Strip comments
		comment = line.find('//')
		if comment != -1:
			line = line[0:comment]

		# Generate new varname / value pairings
		# The regular expression parses a valid line into components
		#   <var>=<value>
		#   <var>[<key>=<keyvalue>]=<value>
		#   e.g.
		#     OTHER_LDFLAGS=-framework EventKit
		#     OTHER_LDFLAGS[sdk=iphoneos4*]=-liconv
		splitline = re.split('(([^\[=]+)(\[[^\]]+\])?) *=? *(.+)', line)

		if len(splitline) >= 5:
			varname = splitline[1]
			value = splitline[4]

			name = prefix + '_' + varname.strip()
			name = re.sub(r'[^\w]', '_', name)
			local_variables[varname] = name
			new_xcconfig += name + '=' + value + '\n'

	module_xcconfig.close()

	# Update any local variable references with new varname
	# and add variables to the global variables map
	for (varname, name) in local_variables.iteritems():
		source = '$(%s)' % varname
		target = '$(%s)' % name
		new_xcconfig = new_xcconfig.replace(source,target)

		# Add new varname to the list
		if not varname in variables:
			variables[varname] = [name]
		else:
			variables[varname].append(name)

	new_xcconfig += '\n'

	return new_xcconfig

def softlink_resources(source,target,use_ignoreDirs=True):
	if not os.path.exists(target):
		os.makedirs(target)
	for file in os.listdir(source):
		if (use_ignoreDirs and (file in ignoreDirs)) or (file in ignoreFiles):
			continue
		from_ = to_unicode_or_not(os.path.join(source, file))
		to_ = to_unicode_or_not(os.path.join(target, file))
		if os.path.isdir(from_):
			print "[DEBUG] creating: %s" % (to_)
			softlink_resources(from_,to_,use_ignoreDirs)
		else:
			print "[DEBUG] linking: %s to %s" % (from_,to_)
			if os.path.exists(to_):
				if os.path.islink(to_):
					os.remove(to_)
					os.symlink(from_, to_)
			else:
				os.symlink(from_, to_)

def clear_application_routing(classes_dir):
	impf = open(os.path.join(classes_dir,'ApplicationRouting.m'),'w+')
	impf.write(HEADER)
	impf.write(IMPL_HEADER)
	impf.write("+ (NSData*) resolveAppAsset:(NSString*)path;\n{\n")
	impf.write("     return nil;\n")
	impf.write('}\n')
	impf.write(FOOTER)
	impf.close()

def softlink_for_simulator(project_dir,app_dir):
	resources_dir = os.path.join(project_dir,'Resources')
	iphone_resources_dir = os.path.join(resources_dir,'iphone')
	iphone_platform_dir = os.path.join(project_dir,'platform','iphone')
	softlink_resources(resources_dir,app_dir)
	if(os.path.exists(iphone_resources_dir)):
		softlink_resources(iphone_resources_dir,app_dir,False)
	dest_mod_dir = os.path.join(app_dir,'modules')
	src_mod_dir = os.path.join(project_dir,'modules')
	if(os.path.exists(src_mod_dir)):
		softlink_resources(src_mod_dir,dest_mod_dir)
		src_mod_iphone_dir = os.path.join(src_mod_dir,'iphone')
		if(os.path.exists(src_mod_iphone_dir)):
			softlink_resources(os.path.join(project_dir,'modules','iphone'),dest_mod_dir,False)
	iphone_classes_dir = os.path.join(project_dir,'build','iphone','Classes')
	clear_application_routing(iphone_classes_dir)

#
# TODO/FIXME
#
# - encryptor
#

class Compiler(object):

	def __init__(self, project_dir, appid, name, deploytype):
		self.deploytype = deploytype
		self.project_dir = project_dir
		self.project_name = name
		self.appid = appid

		if deploytype != 'export-build' and deploytype != 'commonjs':
			self.iphone_dir = os.path.join(project_dir,'build','iphone')
		else:
			self.iphone_dir = project_dir

		self.classes_dir = os.path.join(self.iphone_dir,'Classes')
		self.assets_dir = os.path.join(self.iphone_dir,'assets')
		self.modules = []
		self.modules_metadata = []
		self.exports = []

		# for now, these are required
		self.defines = ['USE_TI_ANALYTICS','USE_TI_NETWORK','USE_TI_PLATFORM','USE_TI_UI', 'USE_TI_API']

	def compileProject(self,xcode=False,devicefamily='ios',iphone_version='iphoneos',silent=False,sdk=None):
		tiapp_xml = os.path.join(self.project_dir,'tiapp.xml')
		ti = TiAppXML(tiapp_xml)
		if sdk is None:
			sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		else:
			sdk_version = sdk

		if xcode:
			app_name = os.environ['FULL_PRODUCT_NAME']
			app_dir = os.path.join(os.environ['TARGET_BUILD_DIR'],os.environ['CONTENTS_FOLDER_PATH'])
		else:
			target = 'Debug'
			if self.deploytype == 'production':
				target = 'Release'
			app_name = self.project_name+'.app'
			app_folder_name = '%s-iphoneos' % target
			app_dir = os.path.abspath(os.path.join(self.iphone_dir,'build',app_folder_name,app_name))

		if not silent:
			print "[INFO] Titanium SDK version: %s" % sdk_version
			print "[INFO] iPhone Device family: %s" % devicefamily
			print "[INFO] iPhone SDK version: %s" % iphone_version

		if self.deploytype != 'export-build':
			main_template_file = os.path.join(template_dir,'main.m')
			main_template = codecs.open(main_template_file, encoding='utf-8').read()
			main_template = main_template.replace('__PROJECT_NAME__',self.project_name)
			main_template = main_template.replace('__PROJECT_ID__',self.appid)
			main_template = main_template.replace('__DEPLOYTYPE__',self.deploytype)
			main_template = main_template.replace('__APP_ID__',self.appid)
			main_template = main_template.replace('__APP_ANALYTICS__',ti.properties['analytics'])
			main_template = main_template.replace('__APP_PUBLISHER__',ti.properties['publisher'])
			main_template = main_template.replace('__APP_URL__',ti.properties['url'])
			main_template = main_template.replace('__APP_NAME__',ti.properties['name'])
			main_template = main_template.replace('__APP_VERSION__',ti.properties['version'])
			main_template = main_template.replace('__APP_DESCRIPTION__',ti.properties['description'])
			main_template = main_template.replace('__APP_COPYRIGHT__',ti.properties['copyright'])
			main_template = main_template.replace('__APP_GUID__',ti.properties['guid'])
			main_template = main_template.replace('__APP_RESOURCE_DIR__','')

			main_template_out = os.path.join(self.iphone_dir,'main.m')
			main_file = codecs.open(main_template_out,'w+',encoding='utf-8')
			main_file_contents = main_file.read()
			if main_file_contents!=main_template:
				main_file.write(main_template)
				main_file.close()

		resources_dir = os.path.join(self.project_dir,'Resources')
		iphone_resources_dir = os.path.join(resources_dir,'iphone')
		iphone_platform_dir = os.path.join(self.project_dir,'platform','iphone')

		# copy in any resources in our module like icons
		# NOTE: This means that any JS-only modules in the local project
		# are hashed up and dumped into the export.
		has_modules = False
		missing_modules, modules, module_js = ([], [], [])
		module_js_dir = os.path.join(self.project_dir,'modules')
		if os.path.exists(module_js_dir):
			for file in os.listdir(module_js_dir):
				if file.endswith('.js'):
					module_js.append({'from':os.path.join(module_js_dir,file),'to':os.path.join(app_dir,file),'path':'modules/'+file})

		if self.deploytype != 'export-build':
			# Have to load the module detection here, in order to
			# prevent distributing even MORE stuff in export/transport
			sys.path.append(os.path.join(template_dir,'../module'))
			from module import ModuleDetector

			detector = ModuleDetector(self.project_dir)
			missing_modules, modules = detector.find_app_modules(ti, 'iphone')

			# we have to copy these even in simulator given the path difference
			if os.path.exists(app_dir):
				self.copy_resources([iphone_resources_dir],app_dir,False)

			if os.path.exists(app_dir):
				self.copy_resources([iphone_platform_dir],app_dir,False)

			# generate the includes for all compiled modules
			xcconfig_c = "// this is a generated file - DO NOT EDIT\n\n"

			if len(modules) > 0:
				mods = open(os.path.join(self.classes_dir,'ApplicationMods.m'),'w+')
				variables = {}
				mods.write(MODULE_IMPL_HEADER)
				for module in modules:
					if module.js:
						# CommonJS module
						module_js.append({'from': module.js, 'path': 'modules/' + os.path.basename(module.js)})
					module_id = module.manifest.moduleid.lower()
					module_name = module.manifest.name.lower()
					module_version = module.manifest.version
					module_guid = ''
					module_licensekey = ''
					if module.manifest.has_property('guid'):
						module_guid = module.manifest.guid
					if module.manifest.has_property('licensekey'):
						module_licensekey = module.manifest.licensekey
					self.modules_metadata.append({'guid':module_guid,'name':module_name,'id':module_id,'dir':module.path,'version':module_version,'licensekey':module_licensekey})
					xcfile = module.get_resource('module.xcconfig')
					if os.path.exists(xcfile):
						xcconfig_contents = parse_xcconfig(xcfile, module_id, variables)
						xcconfig_c += xcconfig_contents
					xcfile = os.path.join(self.project_dir,'modules','iphone',"%s.xcconfig" % module_name)
					if os.path.exists(xcfile):
						xcconfig_contents = parse_xcconfig(xcfile, module_id, variables)
						xcconfig_c += xcconfig_contents
					mods.write("	[modules addObject:[NSDictionary dictionaryWithObjectsAndKeys:@\"%s\",@\"name\",@\"%s\",@\"moduleid\",@\"%s\",@\"version\",@\"%s\",@\"guid\",@\"%s\",@\"licensekey\",nil]];\n" % (module_name,module_id,module_version,module_guid,module_licensekey));

					# Load export symbols from modules...
					metadata_path = os.path.join(module.path, 'metadata.json')
					if os.path.exists(metadata_path):
						self.load_metadata(metadata_path)

				mods.write("	return modules;\n")
				mods.write("}\n")
				mods.write(FOOTER)
				mods.close()

				for (name, values) in variables.iteritems():
					xcconfig_c += name + '=$(inherited) '
					for value in values:
						xcconfig_c += '$(%s) ' % value
					xcconfig_c += '\n'

				has_modules = True
				xcconfig = os.path.join(self.iphone_dir,"module.xcconfig")
				make_xcc = True
				if os.path.exists(xcconfig):
					existing_xcc = open(xcconfig).read()
					# only copy if different so we don't trigger re-compile in xcode
					make_xcc = existing_xcc!=xcconfig_c
				if make_xcc:
					xcconfig = open(xcconfig,'w')
					xcconfig.write(xcconfig_c)
					xcconfig.close()
		#endif deploytype != 'export-build'
		else:
			# ... And for exported projects, load export symbols from
			# the 'metadata' dir.
			metadata_dir = os.path.join(self.iphone_dir, 'metadata')
			if os.path.isdir(metadata_dir):
				for file in os.listdir(metadata_dir):
					self.load_metadata(os.path.join(metadata_dir,file))

		if self.deploytype=='simulator' or self.deploytype=='export':
			shutil.copy(os.path.join(template_dir,'Classes','defines.h'),os.path.join(self.classes_dir,'defines.h'))

		if self.deploytype!='development' or has_modules:

			if os.path.exists(app_dir) and self.deploytype != 'development':
				self.copy_resources([resources_dir],app_dir,True,module_js)

			if self.deploytype == 'production':
				debugger_plist = os.path.join(app_dir,'debugger.plist')
				if os.path.exists(debugger_plist):
					os.remove(debugger_plist)

			if self.deploytype!='development' and self.deploytype!='export':
				defines_file = os.path.join(self.classes_dir, 'defines.h')
				defines_header = open(defines_file,'w+')
				defines_content = "// Warning: this is generated file. Do not modify!\n\n"
				defines_content+= "#define TI_VERSION %s\n"%sdk_version
				for sym in self.defines:
					defines_content+="#define %s\n" % sym

				if defines_content!=defines_header.read():
					defines_header.write(defines_content)
					defines_header.close()

			# deploy any module image files
			for module in self.modules:
				img_dir = os.path.join(template_dir,'modules',module.lower(),'images')
				print "[DEBUG] module image = %s" % img_dir
				if not os.path.exists(img_dir): continue
				dest_img_dir = os.path.join(app_dir,'modules',module.lower(),'images')
				if not os.path.exists(dest_img_dir):
					os.makedirs(dest_img_dir)
				self.copy_resources([img_dir],dest_img_dir,False)


			if self.deploytype!='development' and os.path.exists(app_dir):
				# optimize PNGs - since we don't include them in the Resources of the xcodeproj
				# the ones we copy in won't get optimized so we need to run it manually
				# we can skip this on the simulator but should do it on device
				dev_path = "/Developer"
				# we need to ask xcode where the root path is
				path = run.run(["/usr/bin/xcode-select","-print-path"],True,False)
				if path:
					dev_path = path.strip()
				run.run(["%s/Platforms/iPhoneOS.platform/Developer/usr/bin/iphoneos-optimize"%dev_path,app_dir],False)

				# remove empty directories
				os.chdir(app_dir)
				os.system("find . -type d -empty -delete")

		else:
			print "[INFO] Skipping JS compile, running from simulator"

		if self.deploytype=='development':
			softlink_for_simulator(self.project_dir,app_dir)

	def compile_module(self):
		root_asset = self.compile_commonjs_file(self.appid+'.js', os.path.join(self.assets_dir, self.appid+'.js'))

		js_files = []
		for root, dirs, files in os.walk(self.assets_dir, True, None, True):
			for file in [f for f in files if os.path.splitext(f)[1] == '.js']:
				full_path = os.path.join(root, file)
				self.compile_js_file(os.path.relpath(full_path, self.assets_dir), full_path, js_files)

		template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		titanium_prep = os.path.abspath(os.path.join(template_dir,'titanium_prep'))

		cmdinputfile = tempfile.TemporaryFile()
		cmdinputfile.write('\n'.join(js_files))
		cmdinputfile.seek(0)
		module_assets = subprocess.Popen([titanium_prep, self.appid, self.assets_dir], stdin=cmdinputfile,stderr=subprocess.STDOUT,stdout=subprocess.PIPE).communicate()[0]
		cmdinputfile.close()

		# Clean up the generated assets
		for file in js_files:
			os.remove(os.path.join(self.assets_dir, file))

		return (root_asset, module_assets)

	def load_metadata(self, file):
		module_metadata = open(file,'r')
		metadata = json.load(module_metadata)
		module_metadata.close()

		for symbol in metadata['exports']:
			self.add_symbol(symbol)

	def add_symbol(self,api):
		print "[DEBUG] detected symbol: %s" % api
		curtoken = ''
		tokens = api.split(".")
		try:
			self.modules.index(tokens[0])
		except:
			self.modules.append(tokens[0])
		for token in tokens:
			curtoken+=token+"."
			symbol = 'USE_TI_%s' % (curtoken.replace('.create','').replace('.','').replace('-','_').upper())
			try:
				self.defines.index(symbol)
			except:
				self.defines.append(symbol)

	def extract_tokens(self,sym,line):
		# sloppy joe parsing coooode
		# could be prettier and faster but it works and rather reliable
		c = 0
		tokens = []
		search = sym + "."
		size = len(search)
		while True:
			i = line.find(search,c)
			if i < 0:
				break
			found = False
			buf = ''
			x = 0
			for n in line[i+size:]:
				# look for a terminal - this could probably be easier
				if n in ['(',')','{','}','=',',',' ',':','!','[',']','+','*','/','~','^','%','\n','\t','\r']:
					found = True
					break
				buf+=n
				x+=1
			tokens.append(buf)
			if found:
				c = i + x + 1
				continue
			break

		return sorted(set(tokens))
		
	def compile_js(self,file_contents):
		for line in file_contents.split(';'):
			for symbol in ('Titanium','Ti'):
				for sym in self.extract_tokens(symbol,line):
					self.add_symbol(sym)
					self.exports.append(sym)

	def process_html_files(self,data,source_root):
		compile = []
		if data.has_key('.js'):
			for entry in data['.html']:
				html_file = entry['from']
				file_contents = open(os.path.expanduser(html_file)).read()
				parser = HTMLParser()
				parser.parse(file_contents)
				# extract all our scripts that are dependencies and we
				# don't compile these
				scripts = parser.get_scripts()
				if len(scripts) > 0:
					js_files = data['.js']
					for script in scripts:
						# if a remote script, ignore
						if script.startswith('http:') or script.startswith('https:'):
							continue
						if script.startswith('app://'):
							script = script[6:]
						# build a file relative to the html file
						fullpath = os.path.abspath(os.path.join(os.path.dirname(html_file),script))
						# remove this script from being compiled
						for f in js_files:
							if f['from']==fullpath:
								# target it to be compiled
								compile.append(f)
								js_files.remove(f)
								break
		return compile

	def compile_js_asset_file(self,path,file):
		file_contents = open(os.path.expanduser(file)).read()
		if self.deploytype == 'production' or self.deploytype == 'commonjs':
			file_contents = jspacker.jsmin(file_contents)
		file_contents = file_contents.replace('Titanium.','Ti.')
		self.compile_js(file_contents)

		path = os.path.join(self.assets_dir,path)
		dir = os.path.dirname(path)
		if not os.path.exists(dir):
		    os.makedirs(dir)
		tfile = open(path,'w+')
		tfile.write(file_contents)
		tfile.close()

	# TODO: We should remove this when we can "safely" say we no longer support
	# versions prior to 2.1, and also change the module loader code in iOS to
	# no longer check for moduleAsset.
	def compile_commonjs_file(self,path,from_):
		js_files = []
		self.compile_js_file(path, from_, js_files)

		template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		titanium_prep = os.path.abspath(os.path.join(template_dir,'titanium_prep'))
		cmdinputfile = tempfile.TemporaryFile()
		cmdinputfile.write('\n'.join(js_files))
		cmdinputfile.seek(0)
		so = subprocess.Popen([titanium_prep, self.appid, self.assets_dir], stdin=cmdinputfile,stderr=subprocess.STDOUT,stdout=subprocess.PIPE).communicate()[0]
		cmdinputfile.close()
		return so

	def compile_js_file(self, path, from_, js_files):
		print "[DEBUG] compiling: %s" % from_
		path = path.replace('.','_')
		self.compile_js_asset_file(path,from_)
		js_files.append(path);

	def copy_resources(self,sources,target,write_routing=True,module_js=[]):

		if write_routing:
			intf = open(os.path.join(self.classes_dir,'ApplicationRouting.h'),'w+')
			impf = open(os.path.join(self.classes_dir,'ApplicationRouting.m'),'w+')

			intf.write(HEADER)
			intf.write(INTERFACE_HEADER)

			impf.write(HEADER)
			impf.write(IMPL_HEADER)
			impf.write("+ (NSData*) resolveAppAsset:(NSString*)path;\n{\n")
			js_files = []

		if not os.path.exists(os.path.expanduser(target)):
			os.makedirs(os.path.expanduser(target))

		if not os.path.exists(self.assets_dir):
			os.makedirs(self.assets_dir)

		def compile_js_file(path,from_):
			year, month, day, hour, minute, second, weekday, yearday, daylight = time.localtime(time.time())
			print "[DEBUG] (%02d:%02d:%02d) compiling: %s" % (hour, minute, second, from_)
			path = path.replace('.','_')
			self.compile_js_asset_file(path,from_)
			js_files.append(path);

		def compile_js_files():
			year, month, day, hour, minute, second, weekday, yearday, daylight = time.localtime(time.time())
			print "[DEBUG] (%02d:%02d:%02d) packaging javascript" % (hour, minute, second)
			template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
			titanium_prep = os.path.abspath(os.path.join(template_dir,'titanium_prep'))
			cmdinputfile = tempfile.TemporaryFile()
			cmdinputfile.write('\n'.join(js_files))
			cmdinputfile.seek(0)
			so = subprocess.Popen([titanium_prep, self.appid, self.assets_dir], stdin=cmdinputfile,stderr=subprocess.STDOUT,stdout=subprocess.PIPE).communicate()[0]
			cmdinputfile.close()
			impf.write(so)
			year, month, day, hour, minute, second, weekday, yearday, daylight = time.localtime(time.time())
			print "[DEBUG] (%02d:%02d:%02d) packaging finished" % (hour, minute, second)

		def add_compiled_resources(source,target):
			print "[DEBUG] copy resources from %s to %s" % (source,target)
			compiled_targets = {}
			for root, dirs, files in os.walk(source, True, None, True):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)	# don't visit ignored directories
				for file in files:
					if file in ignoreFiles:
						continue
					prefix = root[len(source):]
					from_ = to_unicode_or_not(os.path.join(root, file))
					to_ = os.path.expanduser(from_.replace(source, target, 1))
					to_directory = os.path.expanduser(os.path.split(to_)[0])
					if not os.path.exists(to_directory):
						os.makedirs(to_directory)
					fp = os.path.splitext(file)
					ext = fp[1]
					if ext == '.jss': continue
					if len(fp)>1 and write_routing and ext in ['.html','.js','.css']:
						path = prefix + os.sep + file
						path = path[1:]
						entry = {'path':path,'from':from_,'to':to_}
						if compiled_targets.has_key(ext):
							compiled_targets[ext].append(entry)
						else:
							compiled_targets[ext]=[entry]
					else:
						# only copy if different filesize or doesn't exist
						if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_):
							print "[DEBUG] copying: %s to %s" % (from_,to_)
							shutil.copyfile(from_, to_)

			if compiled_targets.has_key('.html'):
				compiled = self.process_html_files(compiled_targets,source)
				if len(compiled) > 0:
					for c in compiled:
						from_ = c['from']
						to_ = c['to']
						path = c['path']
						print "[DEBUG] copying: %s to %s" % (from_,to_)
						file_contents = open(from_).read()
						file_contents = jspacker.jsmin(file_contents)
						file_contents = file_contents.replace('Titanium.','Ti.')
						to = open(to_,'w')
						to.write(file_contents)
						to.close()

			for ext in ('.css','.html'):
				if compiled_targets.has_key(ext):
					for css_file in compiled_targets[ext]:
						from_ = css_file['from']
						to_ = css_file['to']
						print "[DEBUG] copying: %s to %s" % (from_,to_)
						if path.endswith('.css'):
							file_contents = open(from_).read()
							packer = CSSPacker(file_contents)
							file_contents = packer.pack()
							to = open(to_,'w')
							to.write(file_contents)
							to.close()
						else:
							shutil.copyfile(from_, to_)

			if compiled_targets.has_key('.js'):
				for js_file in compiled_targets['.js']:
					path = js_file['path']
					from_ = js_file['from']
					compile_js_file(path, from_)

		# copy in any module assets
		for metadata in self.modules_metadata:
			tp_dir = os.path.join(metadata['dir'],'assets')
			if not os.path.exists(tp_dir): continue
			tp_id = metadata['id']
			t = '%s/modules/%s' %(target,tp_id)
			add_compiled_resources(tp_dir,t)

		for source in sources:
			add_compiled_resources(source,target)

		if write_routing:
			for js_file in module_js:
				compile_js_file(js_file['path'], js_file['from'])

			compile_js_files();
			impf.write("\tNSNumber *index = [map objectForKey:path];\n")
			impf.write("\tif (index == nil) { return nil; }\n")
			impf.write("\treturn filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);\n")
			impf.write('}\n')

			intf.write(FOOTER)
			impf.write(FOOTER)

			intf.close()
			impf.close()

if __name__ == "__main__":
	argv = sys.argv
	if len(argv) < 3:
		print "[USAGE] %s <dir> <deploytype> [devicetype] [ios_version] [sdk_version]" % argv[0]
		exit(1)

	project_dir = argv[1]
	deploytype = argv[2]

	if deploytype == 'export-build':
		xcode = True
	else:
		xcode = False

	if len(argv) >= 4:
		devicefamily = argv[3]
	else:
		devicefamily = 'unknown'

	if len(argv) >= 5:
		ios = argv[4]
	else:
		ios = 'unknown'

	if len(argv) >= 6:
		sdk = argv[5]
	else:
		sdk = None

	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	ti = TiAppXML(tiapp_xml)
	appid = ti.properties['id']
	name = ti.properties['name']
	c = Compiler(project_dir,appid,name,deploytype)
	c.compileProject(xcode,devicefamily,ios,sdk=sdk)


