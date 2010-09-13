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
sys.path.append(path.join(cwd,"support","android"))
import titanium_version, ant
from androidsdk import AndroidSDK
version = titanium_version.version

# allow it to be overriden on command line or in env
if os.environ.has_key('PRODUCT_VERSION'):
	version = os.environ['PRODUCT_VERSION']
elif ARGUMENTS.get('PRODUCT_VERSION', 0):
	version = ARGUMENTS.get('PRODUCT_VERSION')

# we clean at the top-level but do incremental at the specific folder level
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

only_package = False
if ARGUMENTS.get("package",0):
	only_package = True

clean = "clean" in COMMAND_LINE_TARGETS or ARGUMENTS.get("clean", 0)
run_drillbit = "drillbit" in COMMAND_LINE_TARGETS or ARGUMENTS.get("drillbit",0)

if clean and os.path.exists('iphone/iphone/build'):
	shutil.rmtree('iphone/iphone/build')

# TEMP until android is merged
build_type = 'full'
build_dirs = ['iphone', 'android']

if ARGUMENTS.get('iphone',0):
	build_type='iphone'
	build_dirs=['iphone']

if ARGUMENTS.get('android',0):
	build_type='android'
	build_dirs=['android']

if ARGUMENTS.get('ipad',0):
	build_type='ipad'
	build_dirs=['ipad']

if ARGUMENTS.get('COMPILER_FLAGS', 0):
	flags = ARGUMENTS.get('COMPILER_FLAGS')

env = Environment()
Export("env cwd version")
if build_type in ['full', 'android'] and not only_package:
	d = os.getcwd()
	os.chdir('android')
	try:
		sdk = AndroidSDK(ARGUMENTS.get("android_sdk", None), 4)
		target = ""
		if clean: target = "clean"
		ant.build(target=target, properties={"build.version": version,
			"android.sdk": sdk.get_android_sdk(), "android.platform": sdk.get_platform_dir(), "google.apis": sdk.get_google_apis_dir()})
	finally:
		os.chdir(d)

if build_type in ['full', 'iphone', 'ipad'] and not only_package \
	and platform.system() == "Darwin":
	d = os.getcwd()
	os.chdir('iphone')
	try:
		#output = 0
		if clean: build_type = "clean"
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
	android = build_type in ['full', 'android']
	iphone = build_type in ['full', 'iphone']
	ipad = build_type in ['full', 'ipad']
	package_all = ARGUMENTS.get('package_all', 0)
	if package_all:
		package.Packager().build_all_platforms(os.path.abspath('dist'), version, android, iphone, ipad)
	else:
		package.Packager().build(os.path.abspath('dist'), version, android, iphone, ipad)

package_builder = Builder(action = package_sdk)
env.Append(BUILDERS = {'PackageMobileSDK': package_builder})
env.PackageMobileSDK("#dummy-sdk-target", [])

def drillbit_builder(target, source, env):
	sys.path.append("drillbit")
	import drillbit
	drillbit.build_and_run(android_sdk=sdk.get_android_sdk())

if run_drillbit:
	drillbit = Builder(action = drillbit_builder)
	env.Append(BUILDERS = {'BuildAndRunDrillbit': drillbit})
	env.BuildAndRunDrillbit('#dummy-drillbit-target', [])

if clean:
	# don't error 
	Exit(0)
