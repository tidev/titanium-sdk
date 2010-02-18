#!/usr/bin/env python
#
# Top level scons script
#
import os, shutil, platform, os.path as path, sys
import package
import SCons.Variables
import SCons.Environment
from SCons.Script import *

# read version from the build folder
# this is used by other python scripts too
cwd = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(path.join(cwd,"build"))
import titanium_version
version = titanium_version.version

# allow it to be overriden on command line or in env
if os.environ.has_key('PRODUCT_VERSION'):
	version = os.environ['PRODUCT_VERSION']
elif ARGUMENTS.get('PRODUCT_VERSION', 0):
	version = ARGUMENTS.get('PRODUCT_VERSION')

# we clean at the top-level but do incremental at the specific folder level
if os.path.exists('iphone/build'):
	shutil.rmtree('iphone/build')

if os.path.exists('android/titanium/bin'):
	shutil.rmtree('android/titanium/bin')
	
#
# this is messy, but i don't care, scons makes it too
# hard to include python after an external SConscript
#

build_dirs = []

if not ARGUMENTS.get('iphone',0):
	build_dirs.append('android/titanium')

if platform.system() == "Darwin" and not ARGUMENTS.get('android',0):
	build_dirs.append('iphone')

flags = ''

# TEMP until android is merged
build_type = 'full'
build_dirs = ['iphone', 'android']

if ARGUMENTS.get('iphone',0):
	build_type='iphone'
	build_dirs=['iphone']

if ARGUMENTS.get('android',0):
	build_type='android'
	build_dirs=['android']

if ARGUMENTS.get('COMPILER_FLAGS', 0):
	flags = ARGUMENTS.get('COMPILER_FLAGS')

env = Environment()
Export("env cwd version")
if build_type in ['full', 'android']:
	env.SConscript("android/SConscript", variant_dir="dist/android", duplicate=0)

if build_type in ['full', 'iphone']:
	d = os.getcwd()
	os.chdir('iphone')
	try:
		#output = 0
		output = os.system("scons PRODUCT_VERSION=%s COMPILER_FLAGS='%s' BUILD_TYPE='%s'" % (version,flags,build_type))	
		if output!=0:
			sys.stderr.write("BUILD FAILED!!!!\n")
			# beep, please
			if platform.system() == "Darwin":
				os.system("say 'OH NO...the build failed!!!'")
				os.system("printf \"\a\"")
				os.system("printf \"\a\"")
				os.system("printf \"\a\"")
			sys.exit(output)
	finally:
		os.chdir(d)

def package_sdk(target, source, env):
	print "Packaging MobileSDK (%s)..." % version
	package.Packager().build(os.path.abspath('dist'), version)

package_builder = Builder(action = package_sdk)
env.Append(BUILDERS = {'PackageMobileSDK': package_builder})
env.PackageMobileSDK("#dummy-sdk-target", [])