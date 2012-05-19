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
		
		self.sdk = androidsdk.AndroidSDK(module_project.sdk)
		if self.sdk.get_platform_dir() == None:
			print "[ERROR] Couldn't find the Android API r%s platform directory" % androidsdk.DEFAULT_API_LEVEL
			sys.exit(1)
		if self.sdk.get_google_apis_dir() == None:
			print "[ERROR] Couldn't find the Google APIs r%s add-on directory" % androidsdk.DEFAULT_API_LEVEL
			sys.exit(1)
		self.init_classpath()
	
	def init_classpath(self):
		classpath_libs = [
			self.sdk.get_android_jar(),
			self.sdk.get_maps_jar(),
			'/'.join([sdk_android_dir, 'titanium.jar']),
			'/'.join([sdk_android_dir, 'js.jar']),
			'/'.join([sdk_android_dir, 'kroll-common.jar']),
			'/'.join([sdk_android_dir, 'kroll-apt.jar'])
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
	
	# escape win32 directories for ant build properties
	def escape_dir(self, dir):
		return dir.replace('\\', '\\\\')
	
	def replace_tokens(self, string):
		string = string.replace('__SDK_ANDROID__', self.escape_dir(sdk_android_dir))
		string = string.replace('___CLASSPATH_ENTRIES___', self.classpath)
		string = string.replace('___ANDROID_PLATFORM___', self.escape_dir(self.sdk.get_platform_dir()))
		string = string.replace('___GOOGLE_APIS___', self.escape_dir(self.sdk.get_google_apis_dir()))
		return string
	
	def get_gitignore(self):
		return ['.apt_generated']
	
	def finished(self):
		os.mkdir(os.path.join(self.project_dir, 'lib'))
		os.makedirs(os.path.join(self.project_dir, 'build', '.apt_generated'))

# Currently just checks to see if "commonjs" key in manifest file
# is set properly.
def check_manifest(module_dir):
	truthy = ("true", "True", 1, "1", "Yes", "yes")
	manifest_file = os.path.join(module_dir, "manifest")
	if not os.path.exists(manifest_file):
		print >> sys.stderr, "Manifest %s does not exist"
		sys.exit(1)

	with open(manifest_file, "r") as f:
		lines = f.readlines()
	id_lines = [l for l in lines if l.strip().startswith("moduleid:")]
	if not id_lines:
		print >> sys.stderr, "[ERROR] Manifest %s does not contain moduleid key." % manifest_file
		sys.exit(1)

	moduleid = id_lines[0].split(":")[1].strip()

	commonjs_lines = [l for l in lines if l.strip().startswith("commonjs:")]

	curval = False
	if commonjs_lines:
		curval = commonjs_lines[0].split(":")[1].strip() in truthy

	is_commonjs = os.path.exists(os.path.join(module_dir, "assets", "%s.js" % moduleid))

	if (is_commonjs and not curval) or (not is_commonjs and curval):
		# Need to re-write the key-value
		for l in commonjs_lines:
			lines.remove(l)
		lines.append("commonjs: %s\n" % ("true" if is_commonjs else "false")) # Trying to avoid locale-specific true/false
		with open(manifest_file, "w") as f:
			f.writelines(lines)
		print "[DEBUG] manifest re-written to set commonjs value"

if __name__ == "__main__":
	from optparse import OptionParser
	parser = OptionParser()
	parser.add_option("-c", "--check-manifest", dest="check_manifest_in_dir",
			help="Check manifest for module")
	(options, args) = parser.parse_args()
	if options.check_manifest_in_dir:
		check_manifest(os.path.abspath(os.path.expanduser(options.check_manifest_in_dir)))
	else:
		# check_manifest is the only thing so far, so
		# nothing to do.
		parser.print_help()
		sys.exit(1)

