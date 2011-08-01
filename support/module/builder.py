#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# module builder script
#
import os, sys, shutil, tempfile, subprocess, platform
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
support_dir = os.path.join(template_dir, 'support')
sdk_dir = os.path.dirname(template_dir)
android_support_dir = os.path.join(sdk_dir, 'android')
sys.path.extend([sdk_dir, support_dir, android_support_dir])

from androidsdk import AndroidSDK
from manifest import Manifest
import traceback, uuid, time, thread, string, markdown
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

def run_python(args, cwd=None):
	args.insert(0, sys.executable)
	return run(args, cwd=cwd)

def run(args, cwd=None):
	proc = run_pipe(args, cwd)
	rc = None
	while True:
		print_emulator_line(proc.stdout.readline())
		rc = proc.poll()
		if rc!=None: break
	return rc

def run_ant(project_dir):
	build_xml = os.path.join(project_dir, 'build.xml')
	ant = 'ant'
	if 'ANT_HOME' in os.environ:
		ant = os.path.join(os.environ['ANT_HOME'], 'bin', 'ant')
	
	if platform.system() == 'Windows':
		ant += '.bat'

	ant_args = [ant, '-f', build_xml]
	
	if platform.system() == 'Windows':
		ant_args = ['cmd.exe', '/C'] + ant_args
	else:
		# wrap with /bin/sh in Unix, in some cases the script itself isn't executable
		ant_args = ['/bin/sh'] + ant_args

	run(ant_args, cwd=project_dir)

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS'];
android_sdk = None

def copy_resources(source, target):
	if not os.path.exists(os.path.expanduser(target)):
		os.makedirs(os.path.expanduser(target))
	for root, dirs, files in os.walk(source):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name) # don't visit ignored directories 
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
		create_project_args = [script, name, moduleid, dir, platform]
		if is_android(platform):
			create_project_args.append(android_sdk.get_android_sdk())
		
		run_python(create_project_args)
		
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

		module_zip_name = '%s-%s-%s.zip' % (moduleid.lower(), platform, version)
		module_zip = os.path.join(project_dir, 'dist', module_zip_name)
		if is_ios(platform):
			module_zip = os.path.join(project_dir, module_zip_name)
			script = os.path.join(project_dir,'build.py')
			run_python([script])
		elif is_android(platform):
			run_ant(project_dir)
		shutil.copy(module_zip, gen_project_dir)

		callback(gen_project_dir)
	except:
		dont_delete = True
		traceback.print_exc(file=sys.stderr)
		sys.exit(1)
	finally:
		if not dont_delete: shutil.rmtree(dir)

def docgen(module_dir, dest_dir):
	if not os.path.exists(dest_dir):
		print "Creating dir: %s" % dest_dir
		os.makedirs(dest_dir)

	doc_dir = os.path.join(module_dir, 'documentation')

	if not os.path.exists(doc_dir):
		print "Couldn't find documentation file at: %s" % doc_dir
		return

	for file in os.listdir(doc_dir):
		if file in ignoreFiles or os.path.isdir(os.path.join(doc_dir, file)):
			continue
		md = open(os.path.join(doc_dir, file), 'r').read()
		html = markdown.markdown(md)
		filename = string.replace(file, '.md', '.html')
		filepath = os.path.join(dest_dir, filename)
		print 'Generating %s' % filepath
		open(filepath, 'w+').write(html)

# a simplified .properties file parser
def read_properties(file):
	properties = {}
	for line in file.read().splitlines():
		line = line.strip()
		if len(line) > 0 and line[0] == '#': continue
		if len(line) == 0 or '=' not in line: continue

		key, value = line.split('=', 1)
		properties[key.strip()] = value.strip().replace('\\\\', '\\')
	return properties

def main(args):
	global android_sdk
	# command platform project_dir
	command = args[1]
	platform = args[2]
	project_dir = os.path.expanduser(args[3])
	manifest = Manifest(os.path.join(project_dir, 'manifest'))
	error = False
	
	if is_android(platform):
		build_properties = read_properties(open(os.path.join(project_dir, 'build.properties')))
		android_sdk_path = os.path.dirname(os.path.dirname(build_properties['android.platform']))
		android_sdk = AndroidSDK(android_sdk_path)

	if command == 'run':
		def run_callback(gen_project_dir):
			script = os.path.abspath(os.path.join(template_dir,'..',platform,'builder.py'))
			script_args = [script, 'run', gen_project_dir]
			if is_android(platform):
				script_args.append(android_sdk.get_android_sdk())
			
			rc = run_python(script_args)
			
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
				run_python([script, 'run-emulator', gen_project_dir, android_sdk.get_android_sdk()])
			
			stage(platform, project_dir, manifest, run_emulator_callback)
	elif command == 'docgen':
		if is_android(platform):
			dest_dir = args[4]
			docgen(project_dir, dest_dir)

	if error:
		sys.exit(1)
	else:
		sys.exit(0)

if __name__ == "__main__":
  main(sys.argv)

