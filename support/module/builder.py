#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# module builder script
#
import os, sys, shutil, tempfile, subprocess
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
android_support_dir = os.path.join(os.path.dirname(template_dir), 'android')
top_support_dir = os.path.dirname(android_support_dir)
sys.path.extend([top_support_dir, android_support_dir])

from androidsdk import AndroidSDK
from manifest import Manifest
import traceback, uuid, time, thread
from os.path import join, splitext, split, exists

def run_pipe(args, cwd=None):
	return subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE, cwd=cwd)

def print_emulator_line(line):
	if line:
		s = line.strip()
		if s!='':
			if s.startswith("["):
				print s
			else:		
				print "[DEBUG] %s" % s
			sys.stdout.flush()

def run(args, cwd=None):
	proc = run_pipe(args, cwd)
	rc = None
	while True:
		print_emulator_line(proc.stdout.readline())
		rc = proc.poll()
		if rc!=None: break
	return rc

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS'];

def copy_resources(source, target):
	if not os.path.exists(os.path.expanduser(target)):
		os.makedirs(os.path.expanduser(target))
	for root, dirs, files in os.walk(source):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			if file in ignoreFiles:
				continue
			from_ = os.path.join(root, file)			  
			to_ = os.path.expanduser(from_.replace(source, target, 1))
			to_directory = os.path.expanduser(split(to_)[0])
			if not exists(to_directory):
				os.makedirs(to_directory)
			shutil.copyfile(from_, to_)


def is_ios(platform):
	return platform == 'iphone' or platform == 'ipad' or platform == 'ios'

def is_android(platform):
	return platform == 'android'
	
def stage(platform, project_dir, manifest, callback):
	dont_delete = True
	dir = tempfile.mkdtemp('ti','m')
	print '[DEBUG] Staging module project at %s' % dir
	try:
		name = manifest.name
		moduleid = manifest.moduleid
		version = manifest.version
		script = os.path.join(template_dir,'..','project.py')
		# create a temporary proj
		run([script,name,moduleid,dir,platform])
		gen_project_dir = os.path.join(dir, name)
		gen_resources_dir = os.path.join(gen_project_dir, 'Resources')
		
		# copy in our example source
		copy_resources(os.path.join(project_dir,'example'), gen_resources_dir)

		# patch in our tiapp.xml
		tiapp = os.path.join(gen_project_dir, 'tiapp.xml')
		xml = open(tiapp).read()
		tiappf = open(tiapp,'w')
		idx = xml.find('</guid>')
		xml = xml.replace('</guid>','</guid>\n<modules>\n<module version="%s">%s</module>\n</modules>\n' % (version,moduleid))
		# generate a guid since this is currently done by developer
		guid = str(uuid.uuid4())
		xml = xml.replace('<guid></guid>','<guid>%s</guid>' % guid)
		tiappf.write(xml)
		tiappf.close()

		module_dir = os.path.join(gen_project_dir,'modules',platform)
		if not os.path.exists(module_dir):
			os.makedirs(module_dir)

		buildfile = None
		if is_ios(platform):
			buildfile = os.path.join(project_dir,'build','lib%s.a' % moduleid)
			# copy our custom module xcconfig
			module_config = os.path.join(project_dir,'module.xcconfig')
			module_target = os.path.join(module_dir,'%s.xcconfig' % moduleid)
			shutil.copyfile(module_config,module_target)

			# build the module
			script = os.path.join(project_dir,'build.py')
			run([script])
		elif is_android(platform):
			buildfile = os.path.join(project_dir, 'dist', '%s.jar' % name)
			build_xml = os.path.join(project_dir, 'build.xml')
			run(['ant', '-f', build_xml], cwd=project_dir)

		if buildfile:
			shutil.copy(buildfile,module_dir)
			
		callback(gen_project_dir)
	except:
		dont_delete = True
		traceback.print_exc(file=sys.stderr)
		sys.exit(1)
	finally:
		if not dont_delete: shutil.rmtree(dir)

def main(args):
	
	# command platform project_dir
	command = args[1]
	platform = args[2]
	project_dir = os.path.expanduser(args[3])
	manifest = Manifest(os.path.join(project_dir, 'manifest'))
	error = False
	
	if is_android(platform):
		sdk = AndroidSDK(manifest.get_property('android.sdk'), 4)
		
	if command == 'run':
		def run_callback(gen_project_dir):
			script = os.path.abspath(os.path.join(template_dir,'..',platform,'builder.py'))
			script_args = [script, 'run', gen_project_dir]
			if is_android(platform):
				script_args.append(sdk.get_android_sdk())
			
			rc = run(script_args)
			
			# run the project
			if rc==1:
				if is_ios(platform):
					error = os.path.join(gen_project_dir,'build','iphone','build','build.log')
					print "[ERROR] Build Failed. See: %s" % os.path.abspath(error)
				else:
					print "[ERROR] Build Failed."
		
		stage(platform, project_dir, manifest, run_callback)
	elif command == 'run-emulator':
		if is_android(platform):
			def run_emulator_callback(gen_project_dir):
				script = os.path.abspath(os.path.join(template_dir, '..', platform, 'builder.py'))
				run([script, 'run-emulator', gen_project_dir, sdk.get_android_sdk()])
			
			stage(platform, project_dir, manifest, run_emulator_callback)
	
	if error:
		sys.exit(1)
	else:
		sys.exit(0)

if __name__ == "__main__":
  main(sys.argv)

