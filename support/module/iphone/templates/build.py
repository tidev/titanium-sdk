#!/usr/bin/env python
#
# Appcelerator Titanium Module Packager
#
#
import os, subprocess, sys, glob, string
import zipfile
from datetime import date

cwd = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
os.chdir(cwd)
required_module_keys = ['name','version','moduleid','description','copyright','license','copyright','platform','minsdk']
module_defaults = {
	'description':'My module',
	'author': 'Your Name',
	'license' : 'Specify your license',
	'copyright' : 'Copyright (c) %s by Your Company' % str(date.today().year),
}
module_license_default = "TODO: place your license here and we'll include it in the module distribution"

def find_sdk(config):
	sdk = config['TITANIUM_SDK']
	return os.path.expandvars(os.path.expanduser(sdk))

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


def read_ti_xcconfig():
	contents = open(os.path.join(cwd,'titanium.xcconfig')).read()
	config = {}
	for line in contents.splitlines(False):
		line = line.strip()
		if line[0:2]=='//': continue
		idx = line.find('=')
		if idx > 0:
			key = line[0:idx].strip()
			value = line[idx+1:].strip()
			config[key] = replace_vars(config,value)
	return config

def generate_doc(config):
	docdir = os.path.join(cwd,'documentation')
	if not os.path.exists(docdir):
		print "Couldn't find documentation file at: %s" % docdir
		return None

	try:
		import markdown2 as markdown
	except ImportError:
		import markdown
	documentation = []
	for file in os.listdir(docdir):
		if file in ignoreFiles or os.path.isdir(os.path.join(docdir, file)):
			continue
		md = open(os.path.join(docdir,file)).read()
		html = markdown.markdown(md)
		documentation.append({file:html});
	return documentation

def compile_js(manifest,config):
	js_file = os.path.join(cwd,'assets','__MODULE_ID__.js')
	if not os.path.exists(js_file): return

	from compiler import Compiler
	try:
		import json
	except:
		import simplejson as json

	compiler = Compiler(cwd, manifest['moduleid'], manifest['name'], 'commonjs')
	root_asset, module_assets = compiler.compile_module()

	root_asset_content = """
%s

	return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[0]);
""" % root_asset

	module_asset_content = """
%s

	NSNumber *index = [map objectForKey:path];
	if (index == nil) {
		return nil;
	}
	return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);
""" % module_assets

	from tools import splice_code

	assets_router = os.path.join(cwd,'Classes','___PROJECTNAMEASIDENTIFIER___ModuleAssets.m')
	splice_code(assets_router, 'asset', root_asset_content)
	splice_code(assets_router, 'resolve_asset', module_asset_content)

	# Generate the exports after crawling all of the available JS source
	exports = open('metadata.json','w')
	json.dump({'exports':compiler.exports }, exports)
	exports.close()

def die(msg):
	print msg
	sys.exit(1)

def warn(msg):
	print "[WARN] %s" % msg

def validate_license():
	c = open(os.path.join(cwd,'LICENSE')).read()
	if c.find(module_license_default)!=-1:
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
	for key in required_module_keys:
		if not manifest.has_key(key): die("missing required manifest key '%s'" % key)
		if module_defaults.has_key(key):
			defvalue = module_defaults[key]
			curvalue = manifest[key]
			if curvalue==defvalue: warn("please update the manifest key: '%s' to a non-default value" % key)
	return manifest,path

ignoreFiles = ['.DS_Store','.gitignore','libTitanium.a','titanium.jar','README']
ignoreDirs = ['.DS_Store','.svn','.git','CVSROOT']

def zip_dir(zf,dir,basepath,ignore=[]):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories
		for file in files:
			if file in ignoreFiles: continue
			e = os.path.splitext(file)
			if len(e) == 2 and e[1] == '.pyc': continue
			if len(e) == 2 and e[1] == '.js': continue
			from_ = os.path.join(root, file)
			to_ = from_.replace(dir, basepath, 1)
			zf.write(from_, to_)

def glob_libfiles():
	files = []
	for libfile in glob.glob('build/**/*.a'):
		if libfile.find('Release-')!=-1:
			files.append(libfile)
	return files

def build_module(manifest,config):
	from tools import ensure_dev_path
	ensure_dev_path()

	rc = os.system("xcodebuild -sdk iphoneos -configuration Release")
	if rc != 0:
		die("xcodebuild failed")
	rc = os.system("xcodebuild -sdk iphonesimulator -configuration Release")
	if rc != 0:
		die("xcodebuild failed")
    # build the merged library using lipo
	moduleid = manifest['moduleid']
	libpaths = ''
	for libfile in glob_libfiles():
		libpaths+='%s ' % libfile

	os.system("lipo %s -create -output build/lib%s.a" %(libpaths,moduleid))

def package_module(manifest,mf,config):
	name = manifest['name'].lower()
	moduleid = manifest['moduleid'].lower()
	version = manifest['version']
	modulezip = '%s-iphone-%s.zip' % (moduleid,version)
	if os.path.exists(modulezip): os.remove(modulezip)
	zf = zipfile.ZipFile(modulezip, 'w', zipfile.ZIP_DEFLATED)
	modulepath = 'modules/iphone/%s/%s' % (moduleid,version)
	zf.write(mf,'%s/manifest' % modulepath)
	libname = 'lib%s.a' % moduleid
	zf.write('build/%s' % libname, '%s/%s' % (modulepath,libname))
	docs = generate_doc(config)
	if docs!=None:
		for doc in docs:
			for file, html in doc.iteritems():
				filename = string.replace(file,'.md','.html')
				zf.writestr('%s/documentation/%s'%(modulepath,filename),html)
	for dn in ('assets','example','platform'):
	  if os.path.exists(dn):
		  zip_dir(zf,dn,'%s/%s' % (modulepath,dn),['README'])
	zf.write('LICENSE','%s/LICENSE' % modulepath)
	zf.write('module.xcconfig','%s/module.xcconfig' % modulepath)
	exports_file = 'metadata.json'
	if os.path.exists(exports_file):
		zf.write(exports_file, '%s/%s' % (modulepath, exports_file))
	zf.close()


if __name__ == '__main__':
	manifest,mf = validate_manifest()
	validate_license()
	config = read_ti_xcconfig()

	sdk = find_sdk(config)
	sys.path.insert(0,os.path.join(sdk,'iphone'))
	sys.path.append(os.path.join(sdk, "common"))

	compile_js(manifest,config)
	build_module(manifest,config)
	package_module(manifest,mf,config)
	sys.exit(0)

