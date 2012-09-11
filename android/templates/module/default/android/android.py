#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Android Module Project Create Script
#
import os, sys, shutil
from string import Template
module_android_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_support_dir = os.path.dirname(module_android_dir)
sys.path.append(module_support_dir)

sdk_dir = os.path.dirname(module_support_dir)
sdk_android_dir = os.path.join(sdk_dir, 'android')
sys.path.insert(0,sdk_android_dir)
sys.path.append(os.path.join(sdk_dir, "common"))

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

# Checks to see if a CommonJS file exists
# and sets the "commonjs" key in manifest file
# properly, and prepares a source code provider class (Java)
# template.
def prepare_commonjs(module_dir):
	module_dir = os.path.abspath(os.path.expanduser(module_dir))
	truthy = ("true", "True", 1, "1", "Yes", "yes")
	manifest_file = os.path.join(module_dir, "manifest")
	if not os.path.exists(manifest_file):
		print >> sys.stderr, "Manifest %s does not exist"
		sys.exit(1)

	assets_folder = os.path.join(module_dir, "assets")
	js_assets = []
	for dirpath, dirnames, filenames in os.walk(assets_folder):
		for f in filenames:
			if f.endswith(".js"):
				js_assets.append(os.path.join(dirpath, f))

	is_commonjs = (len(js_assets) > 0)

	f = open(manifest_file, "r")
	lines = f.readlines()
	f.close()
	id_lines = [l for l in lines if l.strip().startswith("moduleid:")]
	if not id_lines:
		print >> sys.stderr, "[ERROR] Manifest %s does not contain moduleid key." % manifest_file
		sys.exit(1)

	moduleid = id_lines[0].split(":")[1].strip()

	commonjs_lines = [l for l in lines if l.strip().startswith("commonjs:")]

	curval = False
	if commonjs_lines:
		curval = commonjs_lines[0].split(":")[1].strip() in truthy

	if (is_commonjs and not curval) or (not is_commonjs and curval):
		# Need to re-write the key-value
		for l in commonjs_lines:
			lines.remove(l)
		lines.append("commonjs: %s\n" % ("true" if is_commonjs else "false")) # Trying to avoid locale-specific true/false
		f = open(manifest_file, "w")
		f.writelines(lines)
		f.close()
		print "[DEBUG] manifest re-written to set commonjs value"

	if is_commonjs:
		# Create the java source file that will hold the results of
		# jspacker.py (i.e., the encrypted js file contents)
		f = open(os.path.join(module_android_dir, "generated", "CommonJsSourceProvider.java"), "r")
		source_provider_template = Template(f.read())
		f.close()
		source_provider_class = source_provider_template.substitute(moduleid=moduleid)
		output_folder = os.path.join(module_dir, "build", "generated", "java")
		if not os.path.exists(output_folder):
			os.makedirs(output_folder)
		f = open(os.path.join(output_folder, "CommonJsSourceProvider.java"), "w")
		f.write(source_provider_class)
		f.close()

		from compiler import Compiler
		import simplejson, java, run, jspacker

		java_command_locations = java.find_java_commands()
		java_command = java_command_locations["java"]
		if not java_command:
			print >> sys.stderr, "[ERROR] java command could not be located. Please check your JAVA_HOME environment variable"
			sys.exit(1)

		modules_used = set()
		output_folder = os.path.join(module_dir, "build", "generated", "js")
		compiled_files = []

		for commonjs_filename in js_assets:
			# Determine which Titanium modules are used within the CommonJS code.
			# We piggy-back on the functionality in compiler.py for this.
			c = Compiler(None, None, None, None, None, None)
			f = open(commonjs_filename, "r")
			c.extract_modules(f.read())
			f.close()
			modules_used |= c.modules

			# Compile the JS file.
			relative_name = os.path.relpath(commonjs_filename, assets_folder)
			compiled_filename = os.path.join(output_folder, relative_name)
			if not os.path.exists(os.path.dirname(compiled_filename)):
				os.makedirs(os.path.dirname(compiled_filename))
			command_args = [java_command,
					"-jar",
					os.path.join(sdk_android_dir, "lib", "closure-compiler.jar"),
					"--js",
					commonjs_filename,
					"--js_output_file",
					compiled_filename,
					"--jscomp_off=internetExplorerChecks"]

			print "[DEBUG] Compiling '%s'" % commonjs_filename
			(out, err, javac_process) = run.run(
					command_args, ignore_error=True, return_error=True, return_process=True)

			if javac_process.returncode != 0:
				print >> sys.stderr, "[ERROR] %s" % str(err)
				sys.exit(1)

			compiled_files.append(compiled_filename)

		# Pack (encrypt) the compiled JS files.
		print "[DEBUG] Packing compiled JavaScript files"
		generated_java_folder = os.path.join(module_dir, "build", "generated", "java")
		jspacker.pack(output_folder, compiled_files, moduleid, generated_java_folder)

		if len(modules_used) > 0:
			output_folder = os.path.join(module_dir, "build", "generated", "json")
			if not os.path.exists(output_folder):
				os.makedirs(output_folder)
			f = open(os.path.join(output_folder, "metadata.json"), "w")
			simplejson.dump({"exports": list(modules_used)}, f)
			f.close()

if __name__ == "__main__":
	usage = "Usage: %s [module_directory]" % os.path.basename(__file__)
	from optparse import OptionParser
	parser = OptionParser(usage=usage)
	parser.add_option("-p", "--prepare-commonjs", dest="prepare_commonjs",
			action="store_true",
			help="Prepares the CommonJS module (if any) found within the module project for compilation.")
	(options, args) = parser.parse_args()
	if options.prepare_commonjs:
		if len(args) == 0:
			module_dir = os.path.abspath(os.getcwd())
		else:
			module_dir = os.path.abspath(os.path.expanduser(args[0]))
		prepare_commonjs(module_dir)
	else:
		# prepare-commonjs is the only thing so far, so
		# nothing to do.
		parser.print_help()
		sys.exit(1)

