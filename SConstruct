#!/usr/bin/env python
#
# Top level scons script
#
import os, shutil, platform
import package
import SCons.Variables
import SCons.Environment
from SCons.Script import *

version = '0.6.0'

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

build_dirs = ['android/titanium']
if platform.system() == "Darwin":
	build_dirs.append('iphone')

for dir in build_dirs:
	d = os.getcwd()
	os.chdir(dir)
	try:
		os.system("scons PRODUCT_VERSION=%s" % version)	
	finally:
		os.chdir(d)

package.Packager().build('dist',version)
