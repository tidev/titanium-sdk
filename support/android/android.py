#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android Application Script
#

import os,sys,shutil,platform
import string,subprocess,re
from mako.template import Template
from xml.etree.ElementTree import ElementTree
from os.path import join, splitext, split, exists
from shutil import copyfile
from androidsdk import AndroidSDK

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];

def run(args):
	return subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE).communicate()[0]

def pipe(args1,args2):
	p1 = subprocess.Popen(args1, stdout=subprocess.PIPE)
	p2 = subprocess.Popen(args2, stdin=p1.stdout, stdout=subprocess.PIPE)
	return p2.communicate()[0]

def copy_resources(source, target):
	 if not os.path.exists(os.path.expanduser(target)):
		  os.mkdir(os.path.expanduser(target))
	 for root, dirs, files in os.walk(source):
		  for name in ignoreDirs:
		  	    if name in dirs:
				    dirs.remove(name)	# don't visit ignored directories			  
		  for file in files:
				if file in ignoreFiles:
					 continue
				from_ = join(root, file)			  
				to_ = os.path.expanduser(from_.replace(source, target, 1))
				to_directory = os.path.expanduser(split(to_)[0])
				if not exists(to_directory):
					 os.makedirs(to_directory)
				print "[TRACE] copying: %s to: %s" % (from_,to_)
				copyfile(from_, to_)
	
class Android(object):

	def __init__(self, name, myid, sdk, deploy_type):
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
			'apiversion' : '4', #Android 1.6
			'deploy_type': deploy_type
		}
		self.config['classname'] = Android.strip_classname(self.name)
		self.deploy_type = deploy_type
	
	@classmethod
	def strip_classname(cls, name):
		classname = ''.join([str.capitalize() for str in re.split('[^A-Za-z0-9_]', name)])
		if re.search("^[0-9]", classname) != None:
			classname = "_" + classname
		return classname
		
	def newdir(self, *segments):
		path = os.path.join(*segments)
		if not os.path.exists(path):
			os.makedirs(path)
		return path

	def copyfile(self, file, src, dest):
		shutil.copy(os.path.join(src, file), os.path.join(dest, file))

	def load_template(self, template):
		return Template(filename=template, output_encoding='utf-8', encoding_errors='replace')

	def render_android_manifest(self):
		template_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)
		tmpl = self.load_template(os.path.join(template_dir, 'templates', 'AndroidManifest.xml'))
		return tmpl.render(config = self.config)

	def render(self, template_dir, template_file, dest, dest_file, **kwargs):
		tmpl = self.load_template(os.path.join(template_dir, 'templates', template_file))
		f = None
		try:
			print "[TRACE] Generating %s" % os.path.join(dest, dest_file)
			f = open(os.path.join(dest, dest_file), "w")
			f.write(tmpl.render(config = self.config, **kwargs))
		finally:
			if f!=None: f.close

	def build_app_info(self, project_dir):
		tiapp = ElementTree()
		assets_tiappxml = os.path.join(project_dir, 'build', 'android', 'bin', 'assets', 'tiapp.xml')
		
		self.app_info = {'fullscreen':'false','navbar-hidden':'false'}
		self.app_properties = {}
		if not os.path.exists(assets_tiappxml):
			shutil.copy(os.path.join(project_dir, 'tiapp.xml'), assets_tiappxml)
		
		tiapp.parse(open(assets_tiappxml, 'r'))
		for key in ['id', 'name', 'version', 'publisher', 'url', 'copyright',
			'description', 'icon', 'analytics', 'guid', 'navbar-hidden', 'fullscreen']:
			el = tiapp.find(key)
			if el != None:
				self.app_info[key] = el.text

		for property_el in tiapp.findall("property"):
			name = property_el.get("name")
			type = property_el.get("type")
			value = property_el.text
			if name == None: continue
			if type == None: type = "string"
			if value == None: value = ""
			self.app_properties[name] = {"type": type, "value": value}
	
	def create(self, dir, build_time=False):
		template_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)
		
		# Build up output directory tree
		project_dir = self.newdir(dir, self.name)
		
		# Paths to Titanium assets that need to be linked into eclipse structure
		self.config['ti_tiapp_xml'] = os.path.join(project_dir, 'tiapp.xml')
		resource_dir = os.path.join(project_dir, 'Resources')
		self.config['ti_resources_dir'] = resource_dir

		app_build_dir = self.newdir(project_dir, 'build')
		app_dir = self.newdir(app_build_dir, 'android')

		#if os.path.exists(os.path.join(app_dir,'bin')):
		#	shutil.rmtree(os.path.join(app_dir,'bin'))
			
		if os.path.exists(os.path.join(app_dir,'src')):
			shutil.rmtree(os.path.join(app_dir,'src'))

		if os.path.exists(os.path.join(app_dir,'res')):
			shutil.rmtree(os.path.join(app_dir,'res'))
			
		app_bin_dir = self.newdir(app_dir, 'bin')
		app_lib_dir = self.newdir(app_dir, 'lib')
		app_src_dir = self.newdir(app_dir, 'src')
		app_res_dir = self.newdir(app_dir, 'res')
		app_bin_classes_dir = self.newdir(app_bin_dir, 'classes')
		
		app_res_drawable_dir = self.newdir(app_res_dir, 'drawable')
		app_assets_dir = self.newdir(app_dir, 'assets')
		app_package_dir = self.newdir(app_src_dir, *self.id.split('.'))
		app_bin_assets_dir = self.newdir(app_bin_dir, 'assets')
		
		self.build_app_info(project_dir)
		# Create android source
		self.render(template_dir, 'AppInfo.java', app_package_dir, self.config['classname'] + 'AppInfo.java',
			app_properties = self.app_properties, app_info = self.app_info)
		
		self.render(template_dir, 'AndroidManifest.xml', app_dir, 'AndroidManifest.xml')
		self.render(template_dir, 'App.java', app_package_dir, self.config['classname'] + 'Application.java')
		self.render(template_dir, 'Activity.java', app_package_dir, self.config['classname'] + 'Activity.java')
		self.render(template_dir, 'classpath', app_dir, '.classpath')
		self.render(template_dir, 'project', app_dir, '.project')
		self.render(template_dir, 'default.properties', app_dir, 'default.properties')
		self.render(template_dir, 'gitignore', app_dir, '.gitignore')

		android_project_resources = os.path.join(project_dir,'Resources','android')

		if build_time==False and os.path.exists(android_project_resources):
			shutil.rmtree(android_project_resources)
		
		if not os.path.exists(android_project_resources):
			copy_resources(os.path.join(template_dir,'resources'),android_project_resources)
		

if __name__ == '__main__':
	# this is for testing only for the time being
	if len(sys.argv) != 5 or sys.argv[1]=='--help':
		print "Usage: %s <name> <id> <directory> <sdk>" % os.path.basename(sys.argv[0])
		sys.exit(1)

	sdk = AndroidSDK(sys.argv[4], 4)
	android = Android(sys.argv[1],sys.argv[2],sdk,None)
	android.create(sys.argv[3])