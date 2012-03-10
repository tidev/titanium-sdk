#!/usr/bin/env python
#
# Appcelerator Titanium Module Packager
#

import os, sys, glob, string, zipfile
from datetime import date

version = '__VERSION__'

required_manifest_keys = ['name','version','moduleid','description','copyright','license','copyright','platform','minsdk']
manifest_defaults = {
	'description':'My module',
	'author': 'Your Name',
	'license' : 'Specify your license',
	'copyright' : 'Copyright (c) %s by Your Company' % str(date.today().year),
}
module_license_default = "TODO: place your license here and we'll include it in the module distribution"

class Compiler(object):

	def __init__(self, deploytype):
		self.deploytype = deploytype
		self.module_path = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.build_path = os.path.join(project_path, 'build')
		
		self.load_manifest()
		self.check_license()
		self.load_timodule_xml()
		
		print '[INFO] Titanium Mobile Web Module Compiler v%s' % version
	
	def load_manifest(self):
		self.manifest = {}
		manifest_file = os.path.join(self.module_path, 'manifest')
		
		if not os.path.exists(manifest_file):
			print '[ERROR] Unable to find manifest file'
			sys.exit(1)
		
		for line in open(manifest_file).readlines():
			line = line.strip()
			if line[0:1] == '#': continue
			if line.find(':') < 0: continue
			key,value = line.split(':')
			self.manifest[key.strip()] = value.strip()
		
		for key in required_manifest_keys:
			if not self.manifest.has_key(key):
				print '[ERROR] Missing required manifest key "%s"' % key
				sys.exit(1)
			
			if manifest_defaults.has_key(key):
				defvalue = manifest_defaults[key]
				curvalue = self.manifest[key]
				if curvalue == defvalue:
					print '[WARN] Please update the manifest key: "%s" to a non-default value' % key
	
	def check_license(self):
		c = open(os.path.join(self.module_path, 'LICENSE')).read()
		if c.find(module_license_default) != -1:
			print '[WARN] Please update the LICENSE file with your license text before distributing'
	
	def load_timodule_xml(self):



		'''
		
		if os.path.exists(build_path):
			shutil.rmtree(build_path, True)
		try:
			os.makedirs(build_path)
		except:
			pass
		
		# generate the package.json file
		# identify deps
		# assemble js file
		# - embed timodule.xml and manifest props
		# compile minify the module
		# run markdown on docs
		# zip up files

def load_timodule_xml(deploytype):
	timodule = {}
	TiAppXML(os.path.join(cwd, 'timodule.xml'), deploytype)
	return timodule
		'''

if __name__ == '__main__':
	if len(sys.argv) > 1 and sys.argv[1].lower() in ['help', '--help', '-h']:
		print 'Usage: %s [<deploytype>]' % os.path.basename(sys.argv[0])
		sys.exit(1)
	Compiler('development' if len(sys.argv) <= 1 else sys.argv[1].lower())
	sys.exit(0)
