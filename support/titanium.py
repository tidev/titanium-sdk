#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Titanium SDK script
#
import os, sys, subprocess, types, re, uuid, platform
from tiapp import *
from manifest import *

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

def die(msg):
	print msg
	sys.exit(1)
	
def validate_project_name(name):
	if re.match("^[A-Za-z]+[A-Za-z0-9_-]*",name)==None:
		die("Invalid project name: %s" % name)

def fork(args, quiet=False):
	# We need to insert the python executable to be safe
	args.insert(0, sys.executable)
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	while proc.poll() == None:
		line = proc.stdout.readline()
		if line and not quiet:
			print line.strip()
			sys.stdout.flush()
	return proc.returncode

def is_module_project(dir):
	if os.path.exists(os.path.join(dir,'manifest')):
		if os.path.exists(os.path.join(dir,'titanium.xcconfig')):
			return True
		elif os.path.exists(os.path.join(dir, 'timodule.xml')):
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
	if os.path.exists(os.path.join(dir,'mobileweb')):
		platforms.append('mobileweb')
	return platforms
	
def check_valid_project(dir,cwd):
	if not is_valid_project(dir):
		if is_valid_project(cwd):
			return cwd
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

def get_required(config, key, env=None):
	if not has_config(config, key):
		if env and env in os.environ: return os.environ[env]
		if env == None:
			die("required argument '--%s' missing" % key)
		else:
			die("required argument '--%s' missing (you can also set the environment variable %s)" % (key, env))
	return config[key]

def get_required_dir(config, key, env=None):
	dir = os.path.expanduser(get_required(config,key,env))
	if not os.path.exists(dir):
		die("directory: %s doesn't exist" % dir)
	return dir

def get_android_sdk(config):
	return get_required_dir(config, 'android', env='ANDROID_SDK')

def is_ios(osname):
	if osname == 'iphone' or osname == 'ipad' or osname == 'ios':
		return True
	return False

def create_iphone_project(project_dir, osname, args):
	script = os.path.join(template_dir, 'project.py')
	name = get_required(args, 'name')
	validate_project_name(name)
	appid = get_required(args, 'id')
	args = [script, name, appid, project_dir, osname]
	retcode = fork(args, True)
	if retcode == 0:
		print "Created %s application project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")
	
def create_iphone_module(project_dir, osname, args):
	script = os.path.join(template_dir, 'module', 'module.py')
	name = get_required(args, 'name')
	validate_project_name(name)
	appid = get_required(args, 'id')
	args = [script, '--name', name, '--id', appid, '--directory', project_dir, '--platform', osname]
	retcode = fork(args, False)
	if retcode == 0:
		print "Created %s module project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")

def create_android_project(project_dir, osname, args):
	script = os.path.join(template_dir, 'project.py')
	name = get_required(args, 'name')
	validate_project_name(name)
	appid = get_required(args, 'id')
	android_sdk = get_android_sdk(args)
	args = [script, name, appid, project_dir, osname, android_sdk]
	retcode = fork(args, True)
	if retcode == 0:
		print "Created %s application project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")

def create_android_module(project_dir, osname, args):
	script = os.path.join(template_dir, 'module', 'module.py')
	
	name = get_required(args, 'name').lower()
	validate_project_name(name)
	appid = get_required(args, 'id')
	android_sdk = get_android_sdk(args)
	args = [script, '--name', name, '--id', appid, '--directory', project_dir, '--platform', osname, '--sdk', android_sdk]
	
	retcode = fork(args, False)
	if retcode == 0:
		print "Created %s module project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")

def create_mobileweb_project(project_dir, osname, args):
	script = os.path.join(template_dir, 'project.py')
	name = get_required(args, 'name')
	validate_project_name(name)
	appid = get_required(args, 'id')
	args = [script, name, appid, project_dir, osname]
	retcode = fork(args, True)
	if retcode == 0:
		print "Created %s application project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")

def create_mobileweb_module(project_dir, osname, args):
	script = os.path.join(template_dir, 'module', 'module.py')
	name = get_required(args, 'name')
	validate_project_name(name)
	appid = get_required(args, 'id')
	args = [script, '--name', name, '--id', appid, '--directory', project_dir, '--platform', osname]
	retcode = fork(args, False)
	if retcode == 0:
		print "Created %s module project" % osname
		return os.path.join(project_dir, name)
	else:
		die("Aborting")

def create_mobile_project(osname, project_dir, args):
	if is_ios(osname):
		return create_iphone_project(project_dir, osname, args)
	elif osname == 'android':
		return create_android_project(project_dir, osname, args)
	elif osname == 'mobileweb':
		return create_mobileweb_project(project_dir, osname, args)
	else:
		die("Unknown platform: %s" % osname)

def create_module_project(osname, project_dir, args):
	if is_ios(osname):
		return create_iphone_module(project_dir, osname, args)
	elif osname == 'android':
		return create_android_module(project_dir, osname, args)
	elif osname == 'mobileweb':
		return create_mobileweb_module(project_dir, osname, args)
	else:
		die("Unknown platform: %s" % osname)

def create_plugin_project(project_dir, args):
	script = os.path.join(template_dir, 'plugin', 'plugin.py')
	project_id = get_required(args, 'id')
	args = [script,'--id', project_id, '--directory', project_dir]
	
	retcode = fork(args, False)
	if retcode == 0:
		print "Created plugin project"
		return os.path.join(project_dir, project_id)
	else:
		die("Aborting")
	
	
###################################################################################
# COMMANDS
###################################################################################
		
		
def create(args):
	project_dir = get_required(args,'dir')
	platform = get_optional(args,'platform')
	atype = get_optional(args,'type','project')
	dir = None
	if type(platform)==types.ListType:
		for osname in platform:
			if atype == 'project':
				dir = create_mobile_project(osname,project_dir,args)
			elif atype == 'module':
				dir = create_module_project(osname,project_dir,args)
			elif atype == 'plugin':
				dir = create_plugin_project(project_dir,args)
			else:
				die("Unknown type: %s" % atype)
	else:
		if atype == 'project':
			dir = create_mobile_project(platform,project_dir,args)
		elif atype == 'module':
			dir = create_module_project(platform,project_dir,args)
		elif atype == 'plugin':
			dir = create_plugin_project(project_dir,args)
		else:
			die("Unknown type: %s" % atype)
		
		# we need to generate a GUID since Ti Developer does this currently
		tiapp = os.path.join(dir,'tiapp.xml')
		guid = str(uuid.uuid4())
		if os.path.exists(tiapp):
			xml = open(tiapp).read()
			xml = xml.replace('<guid/>','<guid></guid>')
			xml = xml.replace('<guid></guid>','<guid>%s</guid>' % guid)
			fout = open(tiapp,'w')
			fout.write(xml)
			fout.close()
		if atype == 'project':
			appid = get_required(args, 'id')
			name = get_required(args, 'name')
		
			manifest = open(os.path.join(project_dir, name, 'manifest'), 'w')
			manifest.write('#appname: %s\n' % name)
			manifest.write('#appid: %s\n' % appid)
			manifest.write('#type: mobile\n')
			manifest.write('#guid: %s\n' % guid)
			manifest.write('#version: %s\n' % get_optional(args, 'version', '1.0'))
			manifest.write('#publisher: %s\n' % get_optional(args, 'publisher', 'not specified'))
			manifest.write('#url: %s\n' % get_optional(args, 'url', 'not specified'))
			manifest.write('#image: %s\n' % get_optional(args, 'image', 'appicon.png'))
			manifest.write('#desc: %s\n' % get_optional(args, 'description', 'not specified'))
			manifest.close()

def build(args):
	print args
	pass
	
def run_project_args(args,script,project_dir,platform):
	if platform == "android":
		android_sdk = get_android_sdk(args)
		return [script, "run", project_dir, android_sdk]

	return [script, "run", project_dir]

def run_module_args(args,script,project_dir,platform):
	return [script,"run",platform,project_dir]
		
def dyn_run(args,project_cb,module_cb):
	cwd = os.getcwd()
	project_dir = check_valid_project(args['dir'],cwd)
	try:
		os.chdir(project_dir)
		platform = None
		atype = get_optional(args,'type',None)
		is_module = is_module_project(project_dir) 
		if is_module:
			manifest = Manifest(os.path.join(project_dir, 'manifest'))
			platform = manifest.platform
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
		
	finally:
		os.chdir(cwd)
			
def run(args):
	dyn_run(args, run_project_args, run_module_args)

def clean_build(project_dir,platform):
	project_build_dir = os.path.join(project_dir,'build',platform)
	for root, dirs, files in os.walk(project_build_dir, topdown=False):
		for name in files:
			os.remove(os.path.join(root, name))
		for name in dirs:
			os.rmdir(os.path.join(root, name))

def clean_platform(project_dir,platform):
	if platform == 'android':
		clean_build(project_dir,'android')
	elif is_ios(platform):
		clean_build(project_dir,'iphone')
	elif platform == 'mobileweb':
		clean_build(project_dir,'mobileweb')

def clean(args):
	project_dir = get_required(args,'dir')
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	touch_tiapp_xml(tiapp_xml)
	
	platform = get_optional(args,'platform')
	if type(platform) == types.NoneType:
		clean_build(project_dir,'android')
		clean_build(project_dir,'iphone')
		clean_build(project_dir,'mobileweb')
	elif type(platform) == types.ListType:
		for osname in platform:
			clean_platform(project_dir,osname)
	else:
		clean_platform(project_dir,platform)

def install_project_args(args,script,project_dir,platform):
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	ti = TiAppXML(tiapp_xml)
	appid = ti.properties['id']
	name = ti.properties['name']
	version = get_optional(args,'ver','4.0')
	return [script,"install",version,project_dir,appid,name]

def install_module_args(args,script,project_dir,platform):
	return [script,"install",platform,project_dir]

def install(args):
	dyn_run(args,install_project_args,install_module_args)

def package_project_args(args,script,project_dir,platform):
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	ti = TiAppXML(tiapp_xml)
	appid = ti.properties['id']
	name = ti.properties['name']
	version = get_optional(args,'ver','4.0')
	return [script,"distribute",version,project_dir,appid,name]

def package_module_args(args,script,project_dir,platform):
	pass
	
def package(args):
	dyn_run(args,package_project_args,package_module_args)

def emulator_args(args, script, project_dir, platform):
	if platform == 'android':
		return [script, 'run-emulator', platform, project_dir]

def emulator(args):
	dyn_run(args, emulator_args, emulator_args)

def docgen_args(args, script, project_dir, platform):
	if platform == 'android':
		default_dest_dir = os.path.join(project_dir, 'build', 'docs')
		dest_dir = get_optional(args, 'dest-dir', default_dest_dir)
		return [script, 'docgen', platform, project_dir, dest_dir]

def docgen(args):
	dyn_run(args, docgen_args, docgen_args)

def fastdev(args):
	# This is Android only for now
	project_dir = check_valid_project(args['dir'], os.getcwd())
	fastdev_script = os.path.join(template_dir, 'android', 'fastdev.py')
	fastdev_args = [sys.executable, fastdev_script]
	fastdev_args.extend(sys.argv[2:])
	fastdev_args.extend([project_dir])
	# put quotes around args with spaces in Windows
	if platform.system() == "Windows":
		new_args = []
		for arg in fastdev_args:
			if ' ' in arg:
				new_args.append('"' + arg + '"')
			else:
				new_args.append(arg)
		fastdev_args = new_args
	os.execv(sys.executable, fastdev_args)

def help(args=[],suppress_banner=False):
	if not suppress_banner:
		print "Appcelerator Titanium"
		print "Copyright (c) 2010-2012 by Appcelerator, Inc."
		print
	
	if len(args)==0:
		print "commands:"
		print
		print "  create      - create a project"
#		print "  build       - build/compile project"
		print "  run         - run an existing project"
		print "  clean       - clean builds"
		print "  emulator    - start the emulator (android)"
		print "  docgen      - generate html docs for a module (android)"
		print "  fastdev     - management for the Android fastdev server"
#		print "  install     - install a project"
#		print "  package     - package a project for distribution"
		print "  help        - get help"
	else:
		cmd = args[0]
		if cmd == 'create':
			print "Usage: %s create [--platform=p] [--type=t] [--dir=d] [--name=n] [--id=i] [--ver=v]" % os.path.basename(sys.argv[0])
			print 
			print "  --platform=p1,p2    	platform: iphone, ipad, android, mobileweb, blackberry, etc."
			print "  --type=t            	type of project: project, module, plugin"
			print "  --dir=d             	directory to create the new project"
			print "  --name=n            	project name"
			print "  --id=i              	project id (ie com.companyName.project"
			print "  --ver=i             	platform version"
			print "  --android=sdk_folder	For android module - the Android SDK folder"
		elif cmd == 'build':
			print "Usage: %s build [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'run':
			print "Usage: %s run [--dir=d] [--platform-p] [--type=t]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d        project directory"
			print "  --platform=p   platform: iphone, ipad, android, mobileweb, blackberry, etc."
			print "  --type=t       type of project: project, module"
		elif cmd == 'clean':
			print "Usage: %s clean [--platform=p1,p2]" % os.path.basename(sys.argv[0])
			print
			print "  --platform=p1,p2    	platform: iphone, ipad, android, mobileweb, etc. If omitted, all platforms will be cleaned."
		elif cmd == 'install':
			print "Usage: %s install [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'package':
			print "Usage: %s package [--dir=d]" % os.path.basename(sys.argv[0])
			print 
			print "  --dir=d    project directory"
		elif cmd == 'docgen':
			print "Usage: %s docgen [--dir=d] [--dest-dir=d]" % os.path.basename(sys.argv[0])
			print
			print "  --dir=d         project directory"
			print "  --dest-dir=d    destination directory"
		elif cmd == 'fastdev':
			android_dir = os.path.join(template_dir, 'android')
			sys.path.append(android_dir)
			import fastdev
			fastdev.get_optparser().print_usage()
		else:
			print "Unknown command: %s" % cmd
	print
	sys.exit(-1)
	
def slurp_args(args):
	config = {"args": []}
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
		else:
			config["args"].append(arg)
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
			config['dir']=os.getcwd()
		else:	
			# expand the path
			config['dir']=os.path.expanduser(config['dir'])
		
		# invoke the command
		c(config)
	sys.exit(0)

if __name__ == "__main__":
	main(sys.argv)

