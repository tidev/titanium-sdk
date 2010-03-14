#!/usr/bin/env python
#
# zip up the titanium mobile SDKs into suitable distribution formats
#
import os, types, glob, shutil, sys, platform
import zipfile

if platform.system() != 'Windows':
	import importresolver

cur_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
top_dir = os.path.abspath(os.path.join(os.path.dirname(sys._getframe(0).f_code.co_filename),'..'))
template_dir = os.path.join(top_dir,'support')
all_dir = os.path.abspath(os.path.join(template_dir,'all'))
android_dir = os.path.abspath(os.path.join(template_dir,'android'))
iphone_dir = os.path.abspath(os.path.join(template_dir,'iphone'))
osx_dir = os.path.abspath(os.path.join(template_dir,'osx'))

ignoreDirs = ['.DS_Store','.git','.gitignore','libTitanium.a','titanium.jar']

def ignore(file):
	 for f in ignoreDirs:
		if file == f:
			return True
	 return False

def zip_dir(zf,dir,basepath):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories
		for file in files:
			e = os.path.splitext(file)
			if len(e)==2 and e[1]=='.pyc': continue
			from_ = os.path.join(root, file)
			to_ = from_.replace(dir, basepath, 1)
			zf.write(from_, to_)

def zip_android(zf,basepath):
	android_dist_dir = os.path.join(top_dir, 'dist', 'android')
	android_jar = os.path.join(android_dist_dir, 'titanium.jar')
	zf.write(android_jar, '%s/android/titanium.jar' % basepath)	
	
	titanium_lib_dir = os.path.join(top_dir, 'android', 'titanium', 'lib')
	for thirdparty_jar in os.listdir(titanium_lib_dir):
		if thirdparty_jar == "smalljs.jar": continue
		elif thirdparty_jar == "commons-codec-1.3.jar": continue
		elif thirdparty_jar == "commons-logging-1.1.1.jar": continue
		jar_path = os.path.join(top_dir, 'android', 'titanium', 'lib', thirdparty_jar)
		zf.write(jar_path, '%s/android/%s' % (basepath, thirdparty_jar))
	
	# include all module lib dependencies
	modules_dir = os.path.join(top_dir, 'android', 'modules')
	for module_dir in os.listdir(modules_dir):
		module_lib_dir = os.path.join(modules_dir, module_dir, 'lib')
		if os.path.exists(module_lib_dir):
			for thirdparty_jar in os.listdir(module_lib_dir):
				if thirdparty_jar.endswith('.jar'):
					jar_path = os.path.join(module_lib_dir, thirdparty_jar)
					zf.write(jar_path, '%s/android/%s' % (basepath, thirdparty_jar))

	android_module_jars = glob.glob(os.path.join(android_dist_dir, 'titanium-*.jar'))
	for android_module_jar in android_module_jars:
		 jarname = os.path.split(android_module_jar)[1]
		 zf.write(android_module_jar, '%s/android/modules/%s' % (basepath, jarname))
	
	#zip_dir(zf, android_dir, basepath+'/android')
	#zip_dir(zf, os.path.join(android_dir, 'resources'), basepath+'/android/resources')
	#zip_dir(zf, os.path.join(android_dir, 'templates'), basepath+'/android/templates')
	#zip_dir(zf, os.path.join(android_dir, 'mako'), basepath+'/android/mako')

def zip_iphone(zf,basepath):
	sys.path.append(iphone_dir)
	import run,prereq
	  
	zf.writestr('%s/iphone/imports.json'%basepath,importresolver.resolve_source_imports(os.path.join(top_dir,'iphone','Classes')))
	
	# include our headers such that 3rd party modules can be compiled
	headers_dir=os.path.join(top_dir,'iphone','Classes')
	for f in os.listdir(headers_dir):
		path = os.path.join(headers_dir,f)
		if os.path.isfile(path) and os.path.splitext(f)[1]=='.h':
			 zf.write(path,'%s/iphone/include/%s' % (basepath,f))
		elif os.path.isdir(path):
			for df in os.listdir(path):
				dfpath = os.path.join(headers_dir,f,df)
				if os.path.isfile(dfpath) and os.path.splitext(df)[1]=='.h':
					 zf.write(dfpath,'%s/iphone/include/%s/%s' % (basepath,f,df))

	tp_headers_dir=os.path.join(top_dir,'iphone','headers','TiCore')
	for f in os.listdir(tp_headers_dir):
		if os.path.isfile(os.path.join(tp_headers_dir,f)) and os.path.splitext(f)[1]=='.h':
			 zf.write(os.path.join(tp_headers_dir,f),'%s/iphone/include/TiCore/%s' % (basepath,f))
	
	xcode_templates_dir =  os.path.join(top_dir,'iphone','templates','xcode')
	zip_dir(zf,xcode_templates_dir,basepath+'/iphone/xcode/templates')
	
	iphone_lib = os.path.join(top_dir,'iphone','iphone','build')
	zf.write(os.path.join(iphone_lib,'libTitanium.a'),'%s/iphone/libTitanium.a'%basepath)
	
	ticore_lib = os.path.join(top_dir,'iphone','lib')
	zf.write(os.path.join(ticore_lib,'libTiCore.a'),'%s/iphone/libTiCore.a'%basepath)
	
	#zip_dir(zf,iphone_dir,basepath+'/iphone')
	#zip_dir(zf,os.path.join(iphone_dir,'resources'),basepath+'/iphone/resources')
	zip_dir(zf,osx_dir,basepath)
	
	modules_dir = os.path.join(top_dir,'iphone','Resources','modules')
	for f in os.listdir(modules_dir):
		if os.path.isdir(os.path.join(modules_dir,f)):
			module_images = os.path.join(modules_dir,f)
			if os.path.exists(module_images):
				module_name = f.replace('Module','').lower()
				zip_dir(zf,module_images,'%s/iphone/modules/%s/images' % (basepath,module_name))
	
		
def zip_it(dist_dir,osname,version,android,iphone):
	if not os.path.exists(dist_dir):
		os.makedirs(dist_dir)
	basepath = 'mobilesdk/%s/%s' % (osname,version)
	sdkzip = os.path.join(dist_dir,'mobilesdk-%s-%s.zip' % (version,osname))
	zf = zipfile.ZipFile(sdkzip, 'w', zipfile.ZIP_DEFLATED)
	
	osdir = os.path.join(template_dir,osname)
	
	zip_dir(zf,all_dir,basepath)
	zip_dir(zf,template_dir,basepath)
	if android: zip_android(zf,basepath)
	if iphone and osname == "osx": zip_iphone(zf,basepath)

	zf.close()

class Packager(object):
	def __init__(self):
		pass
	 
	def build(self,dist_dir,version,android=True,iphone=True):
		os_names = { "Windows":"win32", "Linux":"linux", "Darwin":"osx" }
		zip_it(dist_dir,os_names[platform.system()],version,android,iphone)


if __name__ == '__main__':
	Packager().build(os.path.abspath('../dist'), "0.9.0")
