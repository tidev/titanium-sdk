#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Android Application Script
#

import os,sys,shutil,platform
import string,subprocess,re
from mako.template import Template

def run(args):
	return subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]

def pipe(args1,args2):
	p1 = subprocess.Popen(args1, stdout=subprocess.PIPE)
	p2 = subprocess.Popen(args2, stdin=p1.stdout, stdout=subprocess.PIPE)
	return p2.communicate()[0]
	
class Android(object):

	def __init__(self, name, myid, sdk):
		self.name = name
		
		# android requires at least one dot in packageid
		if len(re.findall(r'\.',myid))==0:
			myid = 'com.%s' % myid
		
		self.id = myid
		self.sdk = sdk

		# Used in templating
		self.config = {
			'appid': self.id,
			'appname' : self.name,
			'appversion' : '1',
			'apiversion' : '3', #Android 1.5
		}
		self.config['classname'] = "".join(string.capwords(self.name).split(' '))


	def newdir(self, *segments):
		path = os.path.join(*segments)
		if not os.path.exists(path):
			os.makedirs(path)
		return path

	def copyfile(self, file, src, dest):
		shutil.copy(os.path.join(src, file), os.path.join(dest, file))

	def load_template(self, template):
		return Template(filename=template, output_encoding='utf-8', encoding_errors='replace')

	def render(self, template_dir, template_file, dest, dest_file):
		tmpl = self.load_template(os.path.join(template_dir, 'templates', template_file))
		try:
			f = open(os.path.join(dest, dest_file), "w")
			f.write(tmpl.render(config = self.config))
		finally:
			f.close

	def create(self, dir):
		template_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)

		# Build up output directory tree
		project_dir = self.newdir(dir, self.name)
		# Paths to Titanium assets that need to be linked into eclipse structure
		self.config['ti_tiapp_xml'] = os.path.join(project_dir, 'tiapp.xml')
		resource_dir = os.path.join(project_dir, 'Resources')
		self.config['ti_resources_dir'] = resource_dir

		app_build_dir = self.newdir(project_dir, 'build')
		app_dir = self.newdir(app_build_dir, 'android')
		app_bin_dir = self.newdir(app_dir, 'bin')
		app_lib_dir = self.newdir(app_dir, 'lib')
		app_src_dir = self.newdir(app_dir, 'src')
		app_res_dir = self.newdir(app_dir, 'res')
		app_sim_dir = self.newdir(app_dir, 'sim')
		
		app_res_drawable_dir = self.newdir(app_res_dir, 'drawable')
		app_assets_dir = self.newdir(app_dir, 'assets')
		app_package_dir = self.newdir(app_src_dir, *self.id.split('.'))

		# Create android source
		self.render(template_dir, 'AndroidManifest.xml', app_dir, 'AndroidManifest.xml')
		self.render(template_dir, 'App.java', app_package_dir, self.config['classname'] + 'Application.java')
		self.render(template_dir, 'Activity.java', app_package_dir, self.config['classname'] + 'Activity.java')
		self.render(template_dir, 'classpath', app_dir, '.classpath')
		self.render(template_dir, 'project', app_dir, '.project')
		self.render(template_dir, 'default.properties', app_dir, 'default.properties')

		# Copy drawable
		android_resources = os.path.join(resource_dir,'android')
		
		android_project_resources = os.path.join(project_dir,'Resources','android')
		if os.path.exists(android_project_resources):
			shutil.rmtree(android_project_resources)
		shutil.copytree(os.path.join(template_dir,'resources'),android_project_resources)

		self.copyfile('titanium.jar', os.path.join(template_dir), app_lib_dir)
		
		# create the AVD and SDCard inside the users home
		home_dir = os.path.join(os.path.expanduser('~'), '.titanium')
		if not os.path.exists(home_dir):
			os.makedirs(home_dir)
		
		android = os.path.join(self.sdk,'tools','android')
		if platform.system() == "Windows":
			android += ".bat"
		avd_output = run([android,'list','avd'])
		
		sdcard = os.path.join(home_dir,'android.sdcard')
		
		# only create the avd if we can't find it
		if len(re.findall('titanium\.avd',avd_output))==0:
			# create a special AVD for the project
			inputgen = os.path.join(template_dir,'input.py')
			pipe([sys.executable, inputgen], [android, '--verbose', 'create', 'avd', '--name', 'titanium', '--target', '2', '--force'])
			
		# create a 10M SDCard for the project
		if not os.path.exists(sdcard):
			mksdcard = os.path.join(self.sdk,'tools','mksdcard')
			if platform.system() == "Windows":
				mksdcard += ".exe"
			
			run([mksdcard, '10M', sdcard])
			
			#cmd = "\"%s\" 10M \"%s\"" %(mksdcard,sdcard)
			#print cmd
			#os.system(cmd)
		

if __name__ == '__main__':
	# this is for testing only for the time being
	if len(sys.argv) != 5 or sys.argv[1]=='--help':
		print "Usage: %s <name> <id> <directory> <sdk>" % os.path.basename(sys.argv[0])
		sys.exit(1)


	android = Android(sys.argv[1],sys.argv[2],sys.argv[4])
	android.create(sys.argv[3])
