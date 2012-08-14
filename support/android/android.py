#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Android Application Script
#

import os, sys, shutil, platform, zipfile
import string, subprocess, re
from xml.etree.ElementTree import ElementTree
from StringIO import StringIO
from os.path import join, splitext, split, exists
from shutil import copyfile
from androidsdk import AndroidSDK
from compiler import Compiler
import bindings

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_dir = os.path.join(os.path.dirname(template_dir), 'module')
common_dir = os.path.join(os.path.dirname(template_dir), 'common')
sys.path.extend([os.path.dirname(template_dir), module_dir, common_dir])
from mako.template import Template
from tiapp import TiAppXML, touch_tiapp_xml
from manifest import Manifest
from module import ModuleDetector
import simplejson

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
	 for root, dirs, files in os.walk(source, True, None, True):
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

	def __init__(self, name, myid, sdk, deploy_type, java):
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
			'apiversion' : '7', #Android 2.1
			'deploy_type': deploy_type,
			'compile_js': False
		}
		self.config['classname'] = Android.strip_classname(self.name)
		self.deploy_type = deploy_type
		self.java = java
	
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
	
	def generate_activities(self, app_package_dir):
		if not 'activities' in self.tiapp.android: return
		for key in self.tiapp.android['activities'].keys():
			activity = self.tiapp.android['activities'][key]
			print '[DEBUG] generating activity class: ' + activity['classname']
			
			self.render(template_dir, 'JSActivity.java', app_package_dir, activity['classname']+'.java', activity=activity)
	
	def generate_services(self, app_package_dir):
		if not 'services' in self.tiapp.android: return
		for key in self.tiapp.android['services'].keys():
			service = self.tiapp.android['services'][key]
			service_type = service['service_type']
			print '[DEBUG] generating service type "%s", class "%s"' %(service_type, service['classname'])
			if service_type == 'interval':
				self.render(template_dir, 'JSIntervalService.java', app_package_dir, service['classname']+'.java', service=service)
			else:
				self.render(template_dir, 'JSService.java', app_package_dir, service['classname']+'.java', service=service)

	def build_modules_info(self, resources_dir, app_bin_dir, include_all_ti_modules=False):
		self.app_modules = []
		(modules, external_child_modules) = bindings.get_all_module_bindings()
		
		compiler = Compiler(self.tiapp, resources_dir, self.java, app_bin_dir,
				None, os.path.dirname(app_bin_dir),
				include_all_modules=include_all_ti_modules)
		compiler.compile(compile_bytecode=False, info_message=None)
		for module in compiler.modules:
			module_bindings = []
			# TODO: we should also detect module properties
			for method in compiler.module_methods:
				if method.lower().startswith(module+'.') and '.' not in method:
					module_bindings.append(method[len(module)+1:])

			module_onAppCreate = None
			module_class = None
			module_apiName = None
			for m in modules.keys():
				if modules[m]['fullAPIName'].lower() == module:
					module_class = m
					module_apiName = modules[m]['fullAPIName']
					if 'onAppCreate' in modules[m]:
						module_onAppCreate = modules[m]['onAppCreate']
					break
			
			if module_apiName == None: continue # module wasn't found
			ext_modules = []
			if module_class in external_child_modules:
				for child_module in external_child_modules[module_class]:
					if child_module['fullAPIName'].lower() in compiler.modules:
						ext_modules.append(child_module)
			self.app_modules.append({
				'api_name': module_apiName,
				'class_name': module_class,
				'bindings': module_bindings,
				'external_child_modules': ext_modules,
				'on_app_create': module_onAppCreate
			})
		
		# discover app modules
		detector = ModuleDetector(self.project_dir)
		missing, detected_modules = detector.find_app_modules(self.tiapp, 'android')
		for missing_module in missing: print '[WARN] Couldn\'t find app module: %s' % missing_module['id']
		
		self.custom_modules = []
		for module in detected_modules:
			if module.jar == None: continue
			module_jar = zipfile.ZipFile(module.jar)
			module_bindings = bindings.get_module_bindings(module_jar)
			if module_bindings is None: continue
			
			for module_class in module_bindings['modules'].keys():
				module_apiName = module_bindings['modules'][module_class]['apiName']
				module_proxy = module_bindings['proxies'][module_class]
				module_id = module_proxy['proxyAttrs']['id']
				module_proxy_class_name = module_proxy['proxyClassName']
				module_onAppCreate = None
				if 'onAppCreate' in module_proxy:
					module_onAppCreate = module_proxy['onAppCreate']

				print '[DEBUG] module_id = %s' % module_id
				if module_id == module.manifest.moduleid:
					# make sure that the module was not built before 1.8.0.1
					try:
						module_api_version = int(module.manifest.apiversion)
						if module_api_version < 2:
							print "[ERROR] The 'apiversion' for '%s' in the module manifest is less than version 2.  The module was likely built against a Titanium SDK pre 1.8.0.1.  Please use a version of the module that has 'apiversion' 2 or greater" % module_id
							touch_tiapp_xml(os.path.join(self.project_dir, 'tiapp.xml'))
							sys.exit(1)

					except(TypeError, ValueError):
						print "[ERROR] The 'apiversion' for '%s' in the module manifest is not a valid value.  Please use a version of the module that has an 'apiversion' value of 2 or greater set in it's manifest file" % module_id
						touch_tiapp_xml(os.path.join(self.project_dir, 'tiapp.xml'))
						sys.exit(1)
 

					print '[DEBUG] appending module: %s' % module_class
					self.custom_modules.append({
						'module_id': module_id,
						'module_apiName': module_apiName,
						'proxy_name': module_proxy_class_name,
						'class_name': module_class,
						'manifest': module.manifest,
						'on_app_create': module_onAppCreate,
						'is_native_js_module': (hasattr(module.manifest, 'commonjs') and module.manifest.commonjs)
					})

		
	def create(self, dir, build_time=False, project_dir=None, include_all_ti_modules=False):
		template_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)
		
		# Build up output directory tree
		if project_dir is None:
			project_dir = self.newdir(dir, self.name)

		self.project_dir = project_dir
		# Paths to Titanium assets that need to be linked into eclipse structure
		self.config['ti_tiapp_xml'] = os.path.join(project_dir, 'tiapp.xml')
		self.tiapp = TiAppXML(self.config['ti_tiapp_xml'])
		resource_dir = os.path.join(project_dir, 'Resources')
		self.config['ti_resources_dir'] = resource_dir

		json_contents = open(os.path.join(template_dir,'dependency.json')).read()
		depends_map = simplejson.loads(json_contents)
		runtime = depends_map['runtimes']['defaultRuntime']
		if self.tiapp.has_app_property("ti.android.runtime"):
			requested_runtime = self.tiapp.get_app_property("ti.android.runtime")
			if requested_runtime == "rhino" or requested_runtime == "v8":
				runtime = requested_runtime
			else:
				print "[ERROR] invalid runtime \"" + requested_runtime + "\" requested, must be 'v8' or 'rhino'"
				sys.exit(1);

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
		app_gen_dir = self.newdir(app_dir, 'gen')
		app_bin_classes_dir = self.newdir(app_bin_dir, 'classes')
		
		app_res_drawable_dir = self.newdir(app_res_dir, 'drawable')
		app_assets_dir = self.newdir(app_dir, 'assets')
		app_package_dir = self.newdir(app_gen_dir, *self.id.split('.'))
		app_bin_assets_dir = self.newdir(app_bin_dir, 'assets')
		
		self.build_app_info(project_dir)
		self.build_modules_info(resource_dir, app_bin_dir, include_all_ti_modules=include_all_ti_modules)
		
		# Create android source
		self.render(template_dir, 'AppInfo.java', app_package_dir, self.config['classname'] + 'AppInfo.java',
			app_properties = self.app_properties, app_info = self.app_info)

		self.render(template_dir, 'AndroidManifest.xml', app_dir, 'AndroidManifest.xml')
		self.render(template_dir, 'App.java', app_package_dir, self.config['classname'] + 'Application.java',
			app_modules = self.app_modules, custom_modules = self.custom_modules, runtime = runtime)
		self.render(template_dir, 'Activity.java', app_package_dir, self.config['classname'] + 'Activity.java')
		self.generate_activities(app_package_dir)
		self.generate_services(app_package_dir)
		self.render(template_dir, 'classpath', app_dir, '.classpath')
		self.render(template_dir, 'project', app_dir, '.project')
		self.render(template_dir, 'default.properties', app_dir, 'default.properties')
		print "[TRACE] Generating app.json"
		f = None
		try:
			f = open(os.path.join(app_bin_assets_dir, "app.json"), "w")
			f.write(simplejson.dumps({"app_modules":self.app_modules}))
		finally:
			if f is not None:
				f.close()
		# Don't override a pre-existing .gitignore in case users have their own preferences
		# for what should be in it. (LH #2446)
		if not os.path.exists(os.path.join(app_dir, '.gitignore')):
			self.render(template_dir, 'gitignore', app_dir, '.gitignore')
		else:
			print "[TRACE] Skipping copying gitignore -> .gitignore because already exists"

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

	sdk = AndroidSDK(sys.argv[4])
	android = Android(sys.argv[1], sys.argv[2], sdk, None, 'java')
	android.create(sys.argv[3])
