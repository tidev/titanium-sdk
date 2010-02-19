#!/usr/bin/env python
#
# zip up the titanium mobile SDKs into suitable distribution formats
#
import os, types, glob, shutil, sys, platform
import zipfile
import importresolver

cur_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
top_dir = os.path.abspath(os.path.join(os.path.dirname(sys._getframe(0).f_code.co_filename),'..'))
template_dir = os.path.join(top_dir,'support')
all_dir = os.path.abspath(os.path.join(template_dir,'all'))
android_dir = os.path.abspath(os.path.join(template_dir,'android'))
iphone_dir = os.path.abspath(os.path.join(template_dir,'iphone'))
osx_dir = os.path.abspath(os.path.join(template_dir,'osx'))

def ignore(file):
	 for f in ['.DS_Store','.git','.gitignore','libTitanium.a','titanium.jar']:
		if file == f:
			return True
	 return False

def zip_dir(zf,dir,basepath):
	for f in os.listdir(dir):
		  if ignore(f) or not os.path.isfile(os.path.join(dir,f)): continue
		  e = os.path.splitext(f)
		  if len(e)==2 and e[1]=='.pyc':continue
		  zf.write(os.path.join(dir,f), basepath + '/' +f)

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
	
	android_module_jars = glob.glob(os.path.join(android_dist_dir, 'titanium-*.jar'))
	for android_module_jar in android_module_jars:
		 jarname = os.path.split(android_module_jar)[1] 
		 zf.write(android_module_jar, '%s/android/modules/%s' % (basepath, jarname)) 
	
	zip_dir(zf, android_dir, basepath+'/android')
	zip_dir(zf, os.path.join(android_dir, 'resources'), basepath+'/android/resources')
	zip_dir(zf, os.path.join(android_dir, 'templates'), basepath+'/android/templates')
	zip_dir(zf, os.path.join(android_dir, 'mako'), basepath+'/android/mako')

def zip_iphone(zf,basepath):
	sys.path.append(iphone_dir)
	import run,prereq
	  
	zf.writestr('%s/iphone/imports.json'%basepath,importresolver.resolve_source_imports(os.path.join(top_dir,'iphone','Classes')))
	
	# include our headers such that 3rd party modules can be compiled
	headers_dir=os.path.join(top_dir,'iphone','Classes')
	for f in os.listdir(headers_dir):
		if os.path.isfile(os.path.join(headers_dir,f)) and os.path.splitext(f)[1]=='.h':
			 zf.write(os.path.join(headers_dir,f),'%s/iphone/include/%s' % (basepath,f))
	  
	iphone_lib = os.path.join(top_dir,'iphone','iphone','build')
	zf.write(os.path.join(iphone_lib,'libTitanium.a'),'%s/iphone/libTitanium.a'%basepath)
	
	ticore_lib = os.path.join(top_dir,'iphone','lib')
	zf.write(os.path.join(ticore_lib,'libTiCore.a'),'%s/iphone/libTiCore.a'%basepath)
	
	zip_dir(zf,iphone_dir,basepath+'/iphone')
	zip_dir(zf,os.path.join(iphone_dir,'resources'),basepath+'/iphone/resources')
	zip_dir(zf,osx_dir,basepath)
	
	modules_dir = os.path.join(top_dir,'iphone','Resources','modules')
	for f in os.listdir(modules_dir):
		if os.path.isdir(os.path.join(modules_dir,f)):
			module_images = os.path.join(modules_dir,f)
			if os.path.exists(module_images):
				module_name = f.replace('Module','').lower()
				zip_dir(zf,module_images,'%s/iphone/modules/%s/images' % (basepath,module_name))
	
		
def zip_it(dist_dir,osname,version):
	if not os.path.exists(dist_dir):
		os.makedirs(dist_dir)
	basepath = 'mobilesdk/%s/%s' % (osname,version)
	sdkzip = os.path.join(dist_dir,'mobilesdk-%s-%s.zip' % (version,osname))
	zf = zipfile.ZipFile(sdkzip, 'w', zipfile.ZIP_DEFLATED)
	
	osdir = os.path.join(template_dir,osname)
	
	zip_dir(zf,all_dir,basepath)
	zip_dir(zf,template_dir,basepath)
	zip_android(zf,basepath)
	if osname == "osx": zip_iphone(zf,basepath)

	zf.close()

class Packager(object):
	def __init__(self):
		pass
	 
	def build(self,dist_dir,version):
		os_names = { "Windows":"win32", "Linux":"linux", "Darwin":"osx" }
		zip_it(dist_dir,os_names[platform.system()],version)


if __name__ == '__main__':
	Packager().build(os.path.abspath('../dist'),"0.9.0")
