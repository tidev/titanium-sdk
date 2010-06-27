#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# module builder script
#
import os,sys,shutil,tempfile,subprocess,traceback
from os.path import join, splitext, split, exists

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

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

def run(args):
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	rc = None
	while True:
		line = proc.stdout.readline()
		if line:
			s = line.strip()
			if s!='':
				if s.startswith("["):
					print s
				else:		
					print "[DEBUG] %s" % s
				sys.stdout.flush()
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


def main(args):
	
	# command platform project_dir
	command = args[1]
	platform = args[2]
	project_dir = os.path.expanduser(args[3])
	
	if command == 'run':
		dir = tempfile.mkdtemp('ti','m')
		dont_delete = True
		error = False
		try:
			manifest = read_manifest(project_dir)
			name = manifest['name']
			moduleid = manifest['moduleid']
			version = manifest['version']
			script = os.path.join(template_dir,'..','project.py')
			# create a temporary proj
			run([script,name,moduleid,dir,platform])
			# copy in our example source
			copy_resources(os.path.join(project_dir,'example'),os.path.join(dir,name,'Resources'))
			
			# patch in our tiapp.xml
			tiapp = os.path.join(dir,name,'tiapp.xml')
			xml = open(tiapp).read()
			tiappf = open(tiapp,'w')
			idx = xml.find('</guid>')
			xml = xml.replace('</guid>','</guid>\n<modules>\n<module version="%s">%s</module>\n</modules>\n' % (version,moduleid))
			tiappf.write(xml)
			tiappf.close()
			
			ios = False
			buildfile = None
			if platform == 'iphone' or platform == 'ipad' or platform == 'ios':
				ios = True
				buildfile = os.path.join(project_dir,'build','lib%s.a' % moduleid)
			
			# build the module
			script = os.path.join(project_dir,'build.py')
			run([script])
			
			module_dir = os.path.join(dir,name,'modules',platform)
			os.makedirs(module_dir)
			
			if buildfile:
				shutil.copy(buildfile,module_dir)
			
			script = os.path.abspath(os.path.join(template_dir,'..',platform,'builder.py'))
			
			# run the project
			rc = run([script,'run',os.path.join(dir,name)])
			if rc==1:
				dont_delete = True
				if ios:
					error = os.path.join(dir,name,'build','iphone','build','build.log')
					print "[ERROR] Build Failed. See: %s" % os.path.abspath(error)
				else:
					print "[ERROR] Build Failed."
			
		except:
			dont_delete = True
			traceback.print_exc(file=sys.stderr)
			sys.exit(1)
		finally:
			if not dont_delete: shutil.rmtree(dir)
	
	if error:
		sys.exit(1)
	else:
		sys.exit(0)

if __name__ == "__main__":
  main(sys.argv)

