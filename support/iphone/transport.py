#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Make an iOS project transportable so that it can be zipped and
# sent to another machine
#

import os, sys, shutil, codecs, glob
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

sys.path.append(os.path.abspath(os.path.dirname(template_dir)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(template_dir),'module')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(template_dir),'common')))

from tiapp import *
from module import ModuleDetector
from pbxproj import PBXProj
from localecompiler import LocaleCompiler
from projector import Projector
from tools import *
from compiler import Compiler

def find_sdk(version):
		sdks = [os.path.join(os.path.expanduser("~/Library/Application Support/Titanium"),"mobilesdk","osx",version),
				os.path.join("/Library","Application Support","Titanium","mobilesdk","osx",version)]
		
		for sdk in sdks:
			if os.path.exists(sdk):
				return sdk
		print "[ERROR] Is Titanium installed? I can't find it"
		sys.exit(1)

def info(msg):
		print "[INFO] %s" % msg
		sys.stdout.flush()

def main(args):
		if len(args) < 2:
				print "Usage: %s <project_directory> [sdk_verison]" % os.path.basename(args[0])
				sys.exit(1)

		# What needs to be done in order to perform a "true" export?
		# ---
		# Wipe the build dir
		# Migrate resources
		# Migrate tiapp.xml (required for scripts)
		# Generate project from template
		# Populate Info.plist
		# Compile/migrate i18n 
		# Migrate scripts for compiling JSS files (and i18n)
		# Modify xcodeproj build steps to call the JSS compiler
		# Then... Share and Enjoy.
		
		project_dir = os.path.abspath(args[1])
		build_dir = os.path.join(project_dir,'build','iphone')
		titanium_local = os.path.join(build_dir,'titanium')
		
		if len(args) == 3:
			version = args[2]
			sdk_dir = find_sdk(version)
		else:
			sdk_dir = os.path.abspath(os.path.dirname(template_dir))
			version = os.path.basename(sdk_dir)			

		tiappxml = os.path.join(project_dir, 'tiapp.xml')
		tiapp = TiAppXML(tiappxml)
		
		app_id = tiapp.properties['id']
		app_name = tiapp.properties['name']
		
		if app_id is None or app_name is None:
			info("Your tiapp.xml is malformed - please specify an app name and id")
			sys.exit(1)
		
		# Clean build dir (if it exists), error otherwise (no iphone support)
		info("Cleaning build...")
		if os.path.exists(build_dir):
			for f in os.listdir(build_dir):
				path = os.path.join(build_dir,f)
				if os.path.isfile(path):
					os.remove(path)
				else:
					shutil.rmtree(path)
		else:
			info("Your project is not configured to be built for iphone.")
			exit(1)
		
		# Migrate Resources
		info("Migrating resources...")
		project_resources = os.path.join(project_dir, 'Resources')
		resources_dir = os.path.join(build_dir, 'Resources')
		
		shutil.copytree(project_resources,resources_dir)

		# Migrate platform/iphone contents into Resources.
		info("Migrating platform/iphone to Resources...")
		project_platform = os.path.join(project_dir,'platform','iphone')
		
		if os.path.isdir(project_platform):
			contents = os.listdir(project_platform)
			for file in contents:
				path = os.path.join(project_platform,file)
				if os.path.isdir(path):
					shutil.copytree(path, os.path.join(resources_dir,file))
				else:
					shutil.copy(path, os.path.join(resources_dir,file))
		
		# Migrate tiapp.xml
		info("Migrating tiapp.xml...")
		shutil.copy(tiappxml, build_dir)
		
		ti = TiAppXML(tiappxml)
		# target the requested value if provided
		if 'min-ios-ver' in ti.ios:
			min_ver = float(ti.ios['min-ios-ver'])
			if min_ver < 4.0:
				print "[INFO] Minimum iOS version %s is lower than 4.0: Using 4.0 as minimum" % min_ver
				min_ver = 4.0

		# Generate project stuff from the template
		info("Generating project from Titanium template...")
		project = Projector(app_name,version,template_dir,project_dir,app_id, min_ver)
		project.create(template_dir,build_dir)			
		
		# Because the debugger.plist is built as part of the required
		# resources, we need to autogen an empty one
		debug_plist = os.path.join(resources_dir,'debugger.plist')
		force_xcode = write_debugger_plist(None, None, None, template_dir, debug_plist)
		
		# Populate Info.plist
		applogo = None
		info("Populating Info.plist...")
		plist_out = os.path.join(build_dir, 'Info.plist')
		create_info_plist(tiapp, template_dir, project_dir, plist_out)
		applogo = tiapp.generate_infoplist(plist_out, app_id, 'iphone', project_dir, None)
		
		# Run the compiler to autogenerate .m files
		info("Copying classes, creating generated .m files...")
		compiler = Compiler(project_dir,app_id,app_name,'export')
		compiler.compileProject(silent=True)
		
		#... But we still have to nuke the stuff that gets built that we don't want
		# to bundle.
		ios_build = os.path.join(build_dir,'build')
		if os.path.isdir(ios_build):
			shutil.rmtree(os.path.join(build_dir,'build'))
		
		# Install applogo/splash/etc.
		info("Copying icons and splash...")
		install_logo(tiapp, applogo, project_dir, template_dir, resources_dir)
		install_defaults(project_dir, template_dir, resources_dir)
		
		# Get Modules
		detector = ModuleDetector(project_dir)
		missing_modules, modules = detector.find_app_modules(tiapp, 'iphone')
		
		if len(missing_modules) != 0:
			for module in missing_modules:
				info("MISSING MODULE: %s ... Project will not build correctly" % module['id'])
			info("Terminating export: Please fix your modules.")
			sys.exit(1)
		
		module_search_path, module_asset_dirs = locate_modules(modules, project_dir, resources_dir, info)
		
		lib_dir = os.path.join(build_dir, 'lib')
		if not os.path.exists(lib_dir): 
			os.makedirs(lib_dir)
		
		if len(module_search_path) > 0:
			info("Copying modules...")
			for module in module_search_path:
				module_name, module_path = module
				info("\t%s..." % module_name)
				shutil.copy(os.path.join(module_path, module_name), lib_dir)
				module[1] = os.path.join(lib_dir, module_name)
				
			info("Copying module metadata...")
			metadata_dir = os.path.join(build_dir, 'metadata')
			for module in modules:
				module_metadata = os.path.join(module.path,'metadata.json')
				if os.path.exists(module_metadata):
					if not os.path.exists(metadata_dir):
						os.makedirs(metadata_dir)
					target = os.path.join(metadata_dir, "%s.json" % module.manifest.moduleid)
					shutil.copyfile(module_metadata, target)
			
			# Note: The module link information has to be added to
			# the xcodeproj after it's created.
			# We also have to mod the module_search_path to reference
			# the local 'lib' directory instead of the original
			# module install location
			info("Linking modules...")
			local_modules = []
			for module in module_search_path:
				name = module[0]
				newpath = os.path.join('lib',name)
				local_modules.append([name, newpath])
			link_modules(local_modules, app_name, build_dir, relative=True)	
		
		# Copy libraries
		info("Copying libraries...")
		iphone_dir = os.path.join(sdk_dir, 'iphone')
		for lib in glob.iglob(os.path.join(iphone_dir,'lib*')):
			info("\t%s..." % lib)
			shutil.copy(lib, lib_dir)
		
		# Process i18n files
		info("Processing i18n...")
		locale_compiler = LocaleCompiler(app_name, project_dir, 'ios', 'development', resources_dir)
		locale_compiler.compile()
		
		# Migrate compile scripts
		info("Copying custom Titanium compiler scripts...")
		shutil.copytree(os.path.join(sdk_dir,'common'),titanium_local)
		shutil.copy(os.path.join(sdk_dir,'tiapp.py'),titanium_local)
		
		iphone_script_dir = os.path.join(titanium_local,'iphone')
		os.mkdir(iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','compiler.py'),iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','tools.py'),iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','run.py'),iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','csspacker.py'),iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','jspacker.py'),iphone_script_dir)
		shutil.copy(os.path.join(sdk_dir,'iphone','titanium_prep'),iphone_script_dir)
		
		# Add compilation to the build script in project
		info("Modifying pre-compile stage...")
		xcodeproj = os.path.join(build_dir,'%s.xcodeproj' % app_name, 'project.pbxproj')
		contents = codecs.open(xcodeproj,'r',encoding='utf-8').read()

		css_compiler = os.path.join('titanium','css','csscompiler.py')
		ti_compiler = os.path.join('titanium','iphone','compiler.py')
		script = """%s . ios Resources
%s . export-build $TARGETED_DEVICE_FAMILY $SDKROOT %s""" % (css_compiler, ti_compiler, version)
		contents = fix_xcode_script(contents,"Pre-Compile",script)

		# write our new project
		f = codecs.open(xcodeproj,'w',encoding='utf-8')
		f.write(contents)
		f.close()		
		
		info("Finished! Share and Enjoy.")


if __name__ == "__main__":
		main(sys.argv)
		sys.exit(0)

