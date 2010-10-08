#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Module Project Create Script
#

import os,sys,shutil,string,uuid,re
from string import capitalize

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS'];
nonFilterFiles = ['.png','.gif','.jpg','.zip','.a','.o', '.jar']

isDebug=False

class ModuleProject(object):
	
	def copy_template_files(self,project_dir,template_dir):
		if isDebug:
			print "Module Name [%s] Project Name [%s] SDK Version [%s] Platform [%s]" % (self.module_name, self.project_name, self.sdk_version, self.platform)
			print "ModuleID [%s] SDK [%s]" % (self.module_id, self.sdk)
			
		for root, dirs, files in os.walk(template_dir):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories
			for file in files:
				if file in ignoreFiles:
					continue
				prefix = root[len(template_dir):]
				from_ = os.path.join(root, file)
				to_ = os.path.expanduser(from_.replace(template_dir, project_dir, 1))
				to_ = to_.replace('___PROJECTNAMEASIDENTIFIER___',self.module_name)
				to_ = to_.replace('___MODULE_NAME_CAMEL___', self.module_name_camel)
				to_ = to_.replace('___MODULE_ID_AS_FOLDER___', self.module_id.replace('.', os.path.sep))
				to_ = to_.replace('___PROJECTNAME___',self.project_name)
				to_ = to_.replace('__MODULE_ID__',self.module_id)
				to_ = to_.replace('__PROJECT_SHORT_NAME__',self.project_short_name)
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
					if isDebug:
						print "Processing contents of %s and writing %s" % (from_, to_)
					contents = open(from_).read()
					tof = open(to_,'w')
					contents = contents.replace('___PROJECTNAMEASIDENTIFIER___',self.module_name)
					contents = contents.replace('___MODULE_NAME_CAMEL___', self.module_name_camel)
					contents = contents.replace('___PROJECTNAME___',self.project_name)
					contents = contents.replace('__PROJECT_SHORT_NAME__',self.project_short_name)
					contents = contents.replace('__VERSION__',self.sdk_version)
					contents = contents.replace('__PLATFORM__',self.platform)
					contents = contents.replace('__MODULE_ID__',self.module_id)
					contents = contents.replace('__GUID__',self.guid)
					tof.write(contents)
					tof.close()
	
	def generate_module_name(self,name):
		modulename = ''
		for token in name.split('.'):
			modulename += token[0:1].upper() + token[1:]
		return modulename
	
	def generate_gitignore(self):
		git = os.path.join(self.project_dir,'.gitignore')
		git_file = open(git,'w')
		git_file.write("tmp\n")
		git_file.write("bin\n")
		git_file.write("build\n")
		git_file.write("*.zip\n")
		git_file.close()
					
	def __init__(self,platform,project_dir,config):
		self.project_short_name = config['name']
		self.project_name = config['name'].lower()
		self.platform = platform
		self.module_id = config['id']
		self.module_name = self.generate_module_name(self.module_id)
		self.sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		self.guid = str(uuid.uuid4())
		self.project_dir = project_dir
		self.module_name_camel = camelcase(self.project_name)
		if config.has_key('sdk'):
		  self.sdk = config['sdk']
		  
		platform_dir = os.path.join(template_dir,platform.lower())
		all_templates_dir = os.path.join(template_dir,'all')
		if os.path.exists(all_templates_dir):
			self.copy_template_files(project_dir,all_templates_dir)
		self.generate_gitignore()
		templates_dir = os.path.join(platform_dir,'templates')
		if os.path.exists(templates_dir):
			self.copy_template_files(project_dir,templates_dir)
		sys.path.append(platform_dir)
		exec "from %s import *" % platform.lower()
		exec "cl = %s" % platform.lower()
		m = cl(project_dir,config,self)

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
		usage(key,required,optional)
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

  if isDebug:
   print "Project Folder: %s" % project_dir

  if os.path.exists(project_dir):
	print "Error. Directory already exists: %s" % project_dir
	sys.exit(1)
  

  module = ModuleProject(config['platform'],project_dir,config)

if __name__ == "__main__":
  main(sys.argv)

