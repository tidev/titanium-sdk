#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Android Module Project Create Script
#
import os, sys, shutil
module_android_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_dir = os.path.dirname(module_android_dir)
sys.path.append(module_dir)

sdk_dir = os.path.dirname(module_dir)
sdk_android_dir = os.path.join(sdk_dir, 'android')
sys.path.append(sdk_android_dir)

import module, androidsdk

class android(module.ModulePlatform):
	def __init__(self, project_dir, config, module_project):
		super(android, self).__init__(project_dir, config, module_project)
		
		self.sdk = androidsdk.AndroidSDK(module_project.sdk, 4)
		self.init_classpath()
	
	def init_classpath(self):
		classpath_libs = [
			self.sdk.get_android_jar(),
			self.sdk.get_maps_jar(),
			'/'.join([sdk_android_dir, 'titanium.jar']),
			'/'.join([sdk_android_dir, 'js.jar'])
		]
		self.classpath = ""
		for lib in classpath_libs:
			self.classpath += '\t<classpathentry kind="lib" path="%s"/>' % lib

	def get_file_dest(self, to_path):
		to_dir, to_file = os.path.split(to_path)
		if to_file == "eclipse_classpath":
			to_file = ".classpath"
		elif to_file == "eclipse_project":
			to_file = ".project"
		return os.path.join(to_dir, to_file)
		
	def replace_tokens(self, string):
		string = string.replace('___CLASSPATH_ENTRIES___', self.classpath)
		string = string.replace('___ANDROID_PLATFORM___', self.sdk.get_platform_dir())
		string = string.replace('___GOOGLE_APIS___', self.sdk.get_google_apis_dir())
		return string
	
	def get_gitignore(self):
		return ['.apt_generated']
	
	def finished(self):
		os.mkdir(os.path.join(self.project_dir, 'lib'))
		os.mkdir(os.path.join(self.project_dir, '.apt_generated'))
		
		# Append the configured Android SDK onto the module's manifest
		manifest_file = os.path.join(self.project_dir, 'manifest')
		manifest = open(manifest_file, 'a+')
		manifest.write('android.sdk: %s' % self.sdk.get_android_sdk())
		manifest.close()