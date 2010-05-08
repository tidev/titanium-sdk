#!/usr/bin/env python
#
# Appcelerator Titanium Module Packager
#
#
import os, sys, glob
import zipfile

cwd = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
required_module_keys = ['name','version','moduleid','description','copyright','license','copyright','platform','minsdk']
module_defaults = {
	'name':'___PROJECTNAMEASIDENTIFIER___',
	'moduleid':'com.company.___PROJECTNAMEASIDENTIFIER___',
	'description':'My module',
	'author': 'Your Name',
	'license' : 'Specify your license',
	'copyright' : 'Copyright (c) 2010 by Your Company',
}

def die(msg):
	print msg
	sys.exit(1)
	
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
	for key in required_module_keys:
		if not manifest.has_key(key): die("missing required manifest key '%s'" % key)	
		if module_defaults.has_key(key):
			defvalue = module_defaults[key]
			curvalue = manifest[key]
			if curvalue==defvalue: die("please update the manifest key: '%s' to a non-default value" % key)
	return manifest,path

ignoreDirs = ['.DS_Store','.svn','.git','.gitignore','libTitanium.a','titanium.jar']
def zip_dir(zf,dir,basepath):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			e = os.path.splitext(file)
			if len(e)==2 and e[1]=='.pyc':continue
			from_ = os.path.join(root, file)	
			to_ = from_.replace(dir, basepath, 1)
			zf.write(from_, to_)

def glob_libfiles():
	files = []
	for libfile in glob.glob('build/**/*.a'):
		if libfile.find('Release-')!=-1:
			files.append(libfile)
	return files
		
def build_module(manifest):
	rc = os.system("xcodebuild -sdk iphoneos -configuration Release")
	if rc != 0:
		die("xcodebuild failed")
	rc = os.system("xcodebuild -sdk iphonesimulator -configuration Release")
	if rc != 0:
		die("xcodebuild failed")
    # build the merged library using lipo
	name = manifest['name'].lower()
	libpaths = ''
	for libfile in glob_libfiles():
		libpaths+='%s ' % libfile
		
	os.system("lipo %s -create -output build/lib%s.a" %(libpaths,name))

	
def package_module(manifest,mf):
	name = manifest['name'].lower()
	version = manifest['version']
	modulezip = '%s-iphone-%s.zip' % (name,version)
	if os.path.exists(modulezip): os.remove(modulezip)
	zf = zipfile.ZipFile(modulezip, 'w', zipfile.ZIP_DEFLATED)
	modulepath = 'modules/iphone/%s/%s' % (name,version)
	zf.write(mf,'%s/manifest' % modulepath)
	libname = 'lib%s.a' % name
	zf.write('build/%s' % libname, '%s/%s' % (modulepath,libname))
	if os.path.exists('assets'):
		zip_dir(zf,'assets','%s/assets' % modulepath)
	zf.write('LICENSE','%s/LICENSE' % modulepath)
	zf.write('module.xcconfig','%s/module.xcconfig' % modulepath)
	zf.close()
	

if __name__ == '__main__':
	manifest,mf = validate_manifest()
	build_module(manifest)
	package_module(manifest,mf)
	sys.exit(0)


