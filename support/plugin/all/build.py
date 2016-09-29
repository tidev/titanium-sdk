#!/usr/bin/env python
#
# Appcelerator Titanium Plugin Packager
#
#
import os, sys, glob, string
import zipfile

cwd = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
required_plugin_keys = ['version','pluginid','description','copyright','license','minsdk']
plugin_defaults = {
	'description':'My plugin',
	'author': 'Your Name',
	'license' : 'Specify your license',
	'copyright' : 'Copyright (c) 2010 by Your Company',
}
plugin_license_default = "TODO: place your license here and we'll include it in the plugin distribution"

def replace_vars(config,token):
	idx = token.find('$(')
	while idx != -1:
		idx2 = token.find(')',idx+2)
		if idx2 == -1: break
		key = token[idx+2:idx2]
		if not config.has_key(key): break
		token = token.replace('$(%s)' % key, config[key])
		idx = token.find('$(')
	return token
		
		
def die(msg):
	print msg
	sys.exit(1)

def warn(msg):
	print "[WARN] %s" % msg	

def validate_license():
	c = open('LICENSE').read()
	if c.find(plugin_license_default)!=1:
		warn('please update the LICENSE file with your license text before distributing')
			
def validate_manifest():
	path = os.path.join(cwd,'manifest')
	f = open(path)
	if not os.path.exists(path): die("missing %s" % path)
	manifest = {}
	for line in f.readlines():
		line = line.strip()
		if line[0:1]=='#': continue
		if line.find(':') < 0: continue
		key,value = line.split(':')
		manifest[key.strip()]=value.strip()
	for key in required_plugin_keys:
		if not manifest.has_key(key): die("missing required manifest key '%s'" % key)	
		if plugin_defaults.has_key(key):
			defvalue = plugin_defaults[key]
			curvalue = manifest[key]
			if curvalue==defvalue: warn("please update the manifest key: '%s' to a non-default value" % key)
	return manifest,path

ignoreFiles = ['.DS_Store','.gitignore','README','build.py']
ignoreDirs = ['.DS_Store','.svn','.git','CVSROOT']

def zip_dir(zf,dir,basepath,ignore=[]):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			if file in ignoreFiles: continue
			e = os.path.splitext(file)
			if len(e)==2 and e[1]=='.pyc':continue
			from_ = os.path.join(root, file)	
			to_ = from_.replace(dir, basepath, 1)
			zf.write(from_, to_)

def package_plugin(manifest,mf):
	pluginid = manifest['pluginid'].lower()
	version = manifest['version']
	pluginzip = '%s-%s.zip' % (pluginid,version)
	if os.path.exists(pluginzip): os.remove(pluginzip)
	zf = zipfile.ZipFile(pluginzip, 'w', zipfile.ZIP_DEFLATED)
	pluginpath = 'plugins/%s/%s' % (pluginid,version)
	for d in os.listdir(cwd):
		if os.path.isdir(d):
			if d in ignoreDirs: continue
			zip_dir(zf,dn,'%s/%s' % (pluginpath,dn))
		else:
			if d in ignoreFiles: continue
			if d.endswith('.zip'): continue
			zf.write(d,'%s/%s' % (pluginpath,d))
	zf.close()
	print "Plugin packaged at %s" % pluginzip
	

if __name__ == '__main__':
	manifest,mf = validate_manifest()
	validate_license()
	package_plugin(manifest,mf)
	sys.exit(0)

