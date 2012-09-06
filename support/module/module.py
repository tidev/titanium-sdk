#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Module Project Create Script
#

import os, sys, shutil, string, uuid, re, zipfile, glob
from string import capitalize
from StringIO import StringIO
from datetime import date

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sdk_dir = os.path.dirname(template_dir)
sys.path.append(sdk_dir)
from manifest import Manifest
from tiapp import TiAppXML

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS'];
nonFilterFiles = ['.png','.gif','.jpg','.zip','.a','.o', '.jar']

class ModulePlatform(object):
	def __init__(self, project_dir, config, module):
		self.project_dir = project_dir
		self.config = config
		self.module = module
	
	@classmethod
	def create_platform(cls, platform, project_dir, config, module):
		platform = platform.lower()
		platform_dir = os.path.join(template_dir, platform)
		sys.path.append(platform_dir)
		platform_module_class = getattr(__import__(platform), platform)
		return platform_module_class(project_dir, config, module)
	
	def replace_tokens(self, string):
		return string
	
	def get_file_dest(self, to_path):
		return to_path
		
	def get_gitignore(self):
		return []
	
	def finished(self):
		pass
	
class ModuleProject(object):
	def __init__(self,platform,project_dir,config):
		self.project_short_name = config['name']
		self.project_name = config['name']
		self.platform = platform
		self.module_id = config['id']
		self.module_name = self.generate_module_name(self.module_id)
		self.sdk_version = os.path.basename(sdk_dir)
		self.guid = str(uuid.uuid4())
		self.project_dir = project_dir
		self.module_name_camel = camelcase(self.project_name)
		self.sdk = None
		if config.has_key('sdk'):
			self.sdk = config['sdk']
	
		self.platform_delegate = ModulePlatform.create_platform(platform, project_dir, config, self)
		platform_dir = os.path.join(template_dir, platform.lower())
		
		all_templates_dir = os.path.join(template_dir,'all')
		if os.path.exists(all_templates_dir):
			self.copy_template_files(all_templates_dir)

		templates_dir = os.path.join(platform_dir,'templates')
		if os.path.exists(templates_dir):
			self.copy_template_files(templates_dir)

		self.generate_gitignore()
		self.platform_delegate.finished()
	
	def replace_tokens(self, string):
		string = string.replace('___PROJECTNAMEASIDENTIFIER___',self.module_name)
		string = string.replace('___MODULE_NAME_CAMEL___', self.module_name_camel)
		string = string.replace('___MODULE_ID_AS_FOLDER___', self.module_id.replace('.', os.path.sep))
		string = string.replace('___PROJECTNAME___',self.project_name)
		string = string.replace('__MODULE_ID__',self.module_id)
		string = string.replace('__PROJECT_SHORT_NAME__',self.project_short_name)
		string = string.replace('__PROJECT_SHORT_NAME_LOWER__',self.project_short_name.lower())
		string = string.replace('__VERSION__',self.sdk_version)
		string = string.replace('__SDK__',sdk_dir)
		string = string.replace('__SDK_ROOT__',os.path.split(sdk_dir)[0].replace(os.path.expanduser('~'),'~',1))
		string = string.replace('__PLATFORM__',self.platform)
		string = string.replace('__GUID__',self.guid)
		string = string.replace('__YEAR__', str(date.today().year))
		string = self.platform_delegate.replace_tokens(string)
		return string
	
	def get_file_dest(self, template_dir, from_path):
		file_dest = os.path.expanduser(from_path.replace(template_dir, self.project_dir, 1))
		return self.platform_delegate.get_file_dest(file_dest)
		
	def copy_template_files(self, template_dir):
		for root, dirs, files in os.walk(template_dir):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories
			for file in files:
				if file in ignoreFiles:
					continue
				prefix = root[len(template_dir):]
				from_ = os.path.join(root, file)
				to_ = self.get_file_dest(template_dir, from_)
				to_ = self.replace_tokens(to_)
				to_directory = os.path.expanduser(os.path.split(to_)[0])
				if not os.path.exists(to_directory):
					os.makedirs(to_directory)
				fp = os.path.splitext(file)
				filter = True
				if len(fp)>1 and fp[1] in nonFilterFiles:
					# if a non-filter file, just copy
					filter = False
				if os.path.exists(to_): os.remove(to_)
				shutil.copy(from_,to_)
				if filter:
					contents = open(from_).read()
					tof = open(to_,'w')
					contents = self.replace_tokens(contents)
					tof.write(contents)
					tof.close()
	
	def generate_module_name(self,name):
		modulename = ''
		for token in name.split('.'):
			modulename += token[0:1].upper() + token[1:]
		return modulename
	
	def generate_gitignore(self):
		git = os.path.join(self.project_dir,'.gitignore')
		git_file = open(git,'w+')
		git_file.write("tmp\n")
		git_file.write("bin\n")
		git_file.write("build\n")
		git_file.write("*.zip\n")
		for ignore in self.platform_delegate.get_gitignore():
			git_file.write(ignore+'\n')
		git_file.close()

class Module(object):
	def __init__(self, path, manifest):
		self.path = path
		self.manifest = manifest

		self.jar = None
		module_jar = self.get_resource(manifest.name + '.jar')
		if os.path.exists(module_jar):
			self.jar = module_jar
		else:
			# To account for Linux filename case-sensitivity,
			# we began to force our external module jars to be lower-case,
			# so give that a shot here.
			module_jar = self.get_resource(manifest.name.lower() + '.jar')
			if os.path.exists(module_jar):
				self.jar = module_jar
		self.lib = None

		module_lib = self.get_resource('lib%s.a' % manifest.moduleid)
		if os.path.exists(module_lib):
			self.lib = module_lib

		self.xml = None
		module_xml = self.get_resource('timodule.xml')
		if os.path.exists(module_xml):
			self.xml = TiAppXML(module_xml, parse_only=True)

		self.js = None
		module_js = self.get_resource('%s.js' % manifest.moduleid)
		if os.path.exists(module_js):
			self.js = module_js
	
	def get_resource(self, *path):
		return os.path.join(self.path, *path)

class ModuleDetector(object):
	def __init__(self, project_dir):
		self.project_dir = project_dir
		self.modules = self.detect_modules()

	def auto_install_modules(self, dir):
		for module_zip in glob.glob(os.path.join(dir, '*-*-*.zip')):
			# in development we store mobilesdk zips in the same place that module zips go
			if os.path.basename(module_zip).startswith('mobilesdk-'):
				continue
			print '[INFO] Installing module: %s' % module_zip
			module_zf = zipfile.ZipFile(module_zip)
			for name in module_zf.namelist():
				if name.endswith('/'): continue
				destdir = os.path.join(dir, os.path.dirname(name.replace('/', os.path.sep)))
				if not os.path.exists(destdir):
					os.makedirs(destdir)
				destfile = open(os.path.join(destdir, os.path.basename(name)), 'wb')
				destfile.write(module_zf.read(name))
				destfile.close()
			module_zf.close()
			os.remove(module_zip)

	def get_modules(self, modules_dir, auto_install=True):
		print '[DEBUG] Detecting modules in %s' % modules_dir
		modules = []
		if auto_install:
			parent_dir = os.path.dirname(os.path.abspath(modules_dir))
			self.auto_install_modules(parent_dir)

		if not os.path.exists(modules_dir): return modules

		for platform in os.listdir(modules_dir):
			platform_dir = os.path.join(modules_dir, platform)
			if not os.path.isdir(platform_dir): continue
			if platform in ['osx', 'win32', 'linux']: continue # skip desktop modules
			
			# iterate through the platform directory so we can get versioned modules too
			for root, dirs, files in os.walk(platform_dir):
				dirs.sort(reverse=True)
				for module_dir in dirs:
					module_dir = os.path.join(root, module_dir)
					manifest_file = os.path.join(module_dir, 'manifest')
					if not os.path.exists(manifest_file): continue
					
					manifest = Manifest(manifest_file)
					print '[DEBUG] Detected module for %s: %s %s @ %s' % (manifest.platform, manifest.moduleid, manifest.version, module_dir)
					modules.append(Module(module_dir, manifest))
		return modules
	
	def detect_modules(self):
		system_modules_dir = os.path.abspath(os.path.join(sdk_dir, '..', '..', '..', 'modules'))
		modules = self.get_modules(os.path.join(self.project_dir, 'modules'))
		modules.extend(self.get_modules(system_modules_dir, auto_install=True))
		return modules

	def is_any(self, module_dep, property):
		value = module_dep[property]
		return value == None or value == ''

	def get_desc(self, module_dep, property):
		if self.is_any(module_dep, property):
			return '<any %s>' % property
		return module_dep[property]

	def find_app_modules(self, tiapp, platform):
		missing = []
		modules = []
		if 'modules' not in tiapp.properties: return missing, modules
		
		for module_dep in tiapp.properties['modules']:
			module_platform = module_dep.get('platform')
			if not self.is_any(module_dep, 'platform') and \
			       module_platform != 'commonjs' and \
			       module_platform != platform:
				continue
			version_desc = self.get_desc(module_dep, 'version')
			platform_desc = self.get_desc(module_dep, 'platform')
			print '[DEBUG] Looking for Titanium Module id: %s, version: %s, platform: %s' % (module_dep['id'], version_desc, platform_desc)
			module = self.find_module(id=module_dep['id'], version=module_dep['version'], platform=module_dep['platform'])
			if module == None:
				print '[WARN] Could not find Titanium Module id: %s, version: %s, platform: %s' % (module_dep['id'], version_desc, platform_desc)
				missing.append(module_dep)
			else:
				modules.append(module)

		return missing, modules

	def find_module(self, id, name=None, version=None, platform=None):
		for module in self.modules:
			manifest = module.manifest
			id_matches = manifest.moduleid == id
			name_matches = name == None or name == "" or manifest.name == name
			version_matches = version == None or version == "" or manifest.version == version
			platform_matches = platform == None or platform == "" or manifest.platform == platform

			if id_matches and name_matches and version_matches and platform_matches:
				return module
		return None
	
def usage(prop,required,optional=None):
	print "Couldn't find required '%s' argument" % prop
	print
	print "Usage: %s <options>" % os.path.basename(sys.argv[0])
	print
	print "Required arguments:\n"
	for key in required:
		disp = key + ' <value>'
		print "	 --%s %s" % (string.ljust(disp,20),required[key])
	if optional:
		print 
		print "Optional arguments:\n"
		for key in optional:
			disp = key + ' <value>'
			print "  --%s %s" % (string.ljust(disp,20),optional[key])
	sys.exit(1)

def sysargs_to_dict(args,required=None,optional=None):
	c = 1
	props = {}
	while c < len(args):
		key = args[c]
		if key[0:2]=='--': key = key[2:]
		value = None
		if c + 1 < len(args):
			value = args[c+1]
		props[key]=value
		c = c + 2
	if required:
		for key in required:
			if not props.has_key(key):
				usage(key, required, optional)
	return props

def camelcase(value):
	return "".join([capitalize(w) for w in re.split(re.compile("[\W_]*"), value)])

def main(args):
	required_opts = {
		'name':'the name of the module',
		'directory':'the directory to create the module',
		'platform':'the platform: such as android, iphone, blackberry, etc',
		'id':'the module id in dotted notation: such as com.yourcompany.foo'
	}
	optional_opts = {
		'sdk':'the platform sdk path'
	}
	config = sysargs_to_dict(args,required_opts,optional_opts)

	module_name = config['name']
	project_dir = os.path.join(os.path.abspath(os.path.expanduser(config['directory'])),module_name)

	if os.path.exists(project_dir):
		print "Error. Directory already exists: %s" % project_dir
		sys.exit(1)
	
	module = ModuleProject(config['platform'],project_dir,config)

if __name__ == "__main__":
	main(sys.argv)

