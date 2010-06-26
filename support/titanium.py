#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Titanium SDK script
#
import os, sys, subprocess, types, re
from tiapp import *

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

def die(msg):
	print msg
	sys.exit(1)
	
def validate_project_name(name):
	if re.match("^[A-Za-z]+[A-Za-z0-9_-]*",name)==None:
		die("Invalid project name: %s" % name)
		
def fork(args,quiet=False):
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	while proc.poll()==None:
		line = proc.stdout.readline()
		if line and not quiet:
			print line.strip()
			sys.stdout.flush()

def is_module_project(dir):
	if os.path.exists(os.path.join(dir,'manifest')) and os.path.exists(os.path.join(dir,'titanium.xcconfig')):
		return True
	return False
	
def is_valid_project(dir):
	if os.path.exists(dir):
		tiapp = os.path.join(dir,'tiapp.xml')
		if os.path.exists(tiapp):
			return True
	return is_module_project(dir)

def detect_platforms(dir):
	platforms = []
	if os.path.exists(os.path.join(dir,'iphone')):
		platforms.append('iphone')
	if os.path.exists(os.path.join(dir,'android')):
		platforms.append('android')
	return platforms
	
def check_valid_project(dir):
	if not is_valid_project(dir):
		die("%s does not contain a valid project" % dir)
	return dir
		
def has_config(config,key,has_value=True):	
	if not config.has_key(key) or (has_value and config[key]==None):
		return False
	return True

def get_optional(config,key,default=None):
	if not has_config(config,key,False):
		return default
	value = config[key]
	if value == None:
		return default
	return value

def get_required(config,key):
	if not has_config(config,key):
		die("required argument '%s' missing" % key)
	return config[key]

def get_required_dir(config,key):
	dir = os.path.expanduser(get_required(config,key))
	if not os.path.exists(dir):
		die("directory: %s doesn't exist" % dir)
	return dir
		
def read_manifest(project_dir):
	path = os.path.join(project_dir,'manifest')
	f = open(path)
	manifest = {}
	for line in f.readlines():
		line = line.strip()
		if line[0:1]=='#': continue
		if line.find(':') < 0: continue
		key,value = line.split(':')
		manifest[key.strip()]=value.strip()
	return manifest
	
def is_ios(osname):
	if osname == 'iphone' or osname == 'ipad' or osname == 'ios':
		return True
	return False

def create_iphone_project(project_dir,osname,args):
	script = os.path.join(template_dir,'project.py')
	name = get_required(args,'name')
	validate_project_name(name)
	appid = get_required(args,'id')
	args = [script,name,appid,project_dir,osname]
	fork(args,True)
	print "Created %s application project" % osname
	
def create_iphone_module(project_dir,osname,args):
	script = os.path.join(template_dir,'module','module.py')
	name = get_required(args,'name')
	validate_project_name(name)
	appid = get_required(args,'id')
	args = [script,'--name',name,'--id',appid,'--directory',project_dir,'--platform',osname]
	fork(args,False)
	print "Created %s module project" % osname

def create_android_project(project_dir,osname,args):
	script = os.path.join(template_dir,'project.py')
	name = get_required(args,'name')
	validate_project_name(name)
	appid = get_required(args,'id')
	android_sdk = get_required_dir(args,'android')
	args = [script,name,appid,project_dir,osname,android_sdk]
	fork(args,True)
	print "Created %s application project" % osname

def create_android_module(project_dir,osname,args):
	die("android modules aren't supported in this release")
	script = os.path.join(template_dir,'module','module.py')
	name = get_required(args,'name')
	validate_project_name(name)
	appid = get_required(args,'id')
	android_sdk = get_required_dir(args,'android')
	args = [script,'--name',name,appid,'--directory',project_dir,'--platform',osname,'--sdk',android_sdk]
	fork(args,True)
	print "Created %s module project" % osname

def create_mobile_project(osname,project_dir,args):
	if is_ios(osname):
		create_iphone_project(project_dir,osname,args)
	elif osname == 'android':
		create_android_project(project_dir,osname,args)
	else:
		die("Unknown platform: %s" % osname)

def create_module_project(osname,project_dir,args):
	if is_ios(osname):
		create_iphone_module(project_dir,osname,args)
	elif osname == 'android':
		create_android_module(project_dir,osname,args)
	else:
		die("Unknown platform: %s" % osname)
	
###################################################################################
# COMMANDS
###################################################################################
		
		
def create(args):
	project_dir = get_required(args,'dir')
	platform = get_required(args,'platform')
	atype = get_optional(args,'type','project')
	if type(platform)==types.ListType:
		for osname in platform:
			if atype == 'project':
				create_mobile_project(osname,project_dir,args)
			elif atype == 'module':
				create_module_project(osname,project_dir,args)
			else:
				die("Unknown type: %s" % atype)
	else:
		if atype == 'project':
			create_mobile_project(platform,project_dir,args)
		elif atype == 'module':
			create_module_project(platform,project_dir,args)
		else:
			die("Unknown type: %s" % atype)
		
def build(args):
	print args
	pass
	
def run_project_args(args,script,project_dir,platform):
	return [script,"run",project_dir]
	
def run_module_args(args,script,project_dir,platform):
	return [script,"run",platform,project_dir]
		
def dyn_run(args,project_cb,module_cb):
	project_dir = check_valid_project(args['dir'])
	platform = None
	atype = get_optional(args,'type',None)
	is_module = is_module_project(project_dir) 
	if is_module:
		manifest = read_manifest(project_dir)
		platform = manifest['platform']
		atype = 'module'
	if atype == None:
		atype = 'project'
	if platform == None:
		if not has_config(args,'platform'):
			platforms = detect_platforms(project_dir)
			if len(platforms)==0 or len(platforms)>1:
				get_required(args,'platform')
			else:
				platform = platforms[0]
		else:
			platform = get_required(args,'platform')
	if atype == 'project':
		script = os.path.join(template_dir,platform,'builder.py')
		cmdline = project_cb(args,script,project_dir,platform)
	elif atype == 'module':
		script = os.path.join(template_dir,'module','builder.py')
		cmdline = module_cb(args,script,project_dir,platform)
	else:
		die("Unknown type: %s" % atype)
		
	if not os.path.exists(script):
		die("Invalid platform type: %s" % platform)
		
	fork(cmdline,get_optional(args,'quiet',False))
			
def run(args):
	dyn_run(args,run_project_args,run_module_args)

def install_project_args(args,script,project_dir,platform):
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	ti = TiAppXML(tiapp_xml)
	appid = ti.properties['id']
	name = ti.properties['name']
	version = get_optional(args,'ver','3.1')
	return [script,"install",version,project_dir,appid,name]
	
def install_module_args(args,script,project_dir,platform):
	pass

def install(args):
	dyn_run(args,install_project_args,install_module_args)

def package_project_args(args,script,project_dir,platform):
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	ti = TiAppXML(tiapp_xml)
	appid = ti.properties['id']
	name = ti.properties['name']
	version = get_optional(args,'ver','3.1')
	return [script,"distribute",version,project_dir,appid,name]

def package_module_args(args,script,project_dir,platform):
	pass
	
def package(args):
	dyn_run(args,package_project_args,package_module_args)

def help(args=[],suppress_banner=False):
	if not suppress_banner:
		print "Appcelerator Titanium"
		print "Copyright (c) 2010 by Appcelerator, Inc."
		print
	
	if len(args)==0:
		print "commands:"
		print
		print "  create      - create a project"
		print "  build       - build/compile project"
		print "  run         - run an existing project"
		print "  install     - install a project"
		print "  package     - package a project for distribution"
		print "  help        - get help"
	else:
		cmd = args[0]
		if cmd == 'create':
			print "Usage: %s create [--platform=p] [--type=t] [--dir=d] [--name=n] [--id=i] [--ver=v]" % os.path.basename(sys.argv[0])
			print 
			print "  --platform=p1,p2    platform: iphone, ipad, android, blackberry, etc."
			print "  --type=t            type of project: mobile, module, template"
			print "  --dir=d             directory to create the new project"
			print "  --name=n            project name"
			print "  --id=i              project id"
			print "  --ver=i             platform version"
		elif cmd == 'build':
			print "Usage: %s build [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'run':
			print "Usage: %s run [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'install':
			print "Usage: %s install [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'package':
			print "Usage: %s package [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		else:
			print "Unknown command: %s" % cmd
	print
	sys.exit(-1)
	
def slurp_args(args):
	config = {}
	for arg in args:
		if arg[0:2]=='--':
			arg = arg[2:]
			idx = arg.find('=')
			k = arg
			v = None
			if idx>0:
				k=arg[0:idx]
				v=arg[idx+1:]
			if v!=None and v.find(',')!=-1:
				v = v.split(',')
			config[k]=v
	return config
				
def main(args):
	if len(args)==1:
		help()
	
	command = args[1]
	a = list(args)
	a.pop(0) # program
	a.pop(0) # command
	try:
		c = eval("%s" % command)	
	except NameError,e:
		help([command])
	if command == 'help':
		c(a)
	else:
		# convert args to a hash
		config = slurp_args(a)
		
		# some config can be checked before hand
		if not config.has_key('dir') or config['dir']==None:
			print "Missing required --dir argument"
			print
			help([command],True)
		
		# expand the path
		config['dir']=os.path.expanduser(config['dir'])
		
		# invoke the command
		c(config)
	sys.exit(0)

if __name__ == "__main__":
	main(sys.argv)

