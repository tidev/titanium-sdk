#!/usr/bin/env python
#
# zip up the titanium mobile SDKs into suitable distribution formats
#
import os, types, glob, shutil, sys, platform
import zipfile, datetime, subprocess, tempfile, time

if platform.system() == 'Darwin':
	import importresolver

cur_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
top_dir = os.path.abspath(os.path.join(os.path.dirname(sys._getframe(0).f_code.co_filename),'..'))
template_dir = os.path.join(top_dir,'support')
doc_dir = os.path.abspath(os.path.join(top_dir, 'apidoc'))
all_dir = os.path.abspath(os.path.join(template_dir,'all'))
android_dir = os.path.abspath(os.path.join(template_dir,'android'))
iphone_dir = os.path.abspath(os.path.join(template_dir,'iphone'))
osx_dir = os.path.abspath(os.path.join(template_dir,'osx'))
win32_dir = os.path.abspath(os.path.join(template_dir, 'win32'))
mobileweb_dir = os.path.abspath(os.path.join(template_dir, 'mobileweb'))

buildtime = datetime.datetime.now()
ts = buildtime.strftime("%m/%d/%y %H:%M")

# get the githash for the build so we can always pull this build from a specific
# commit
gitCmd = "git"
if platform.system() == "Windows":
	gitCmd += ".cmd"

p = subprocess.Popen([gitCmd,"show","--abbrev-commit"],stderr=subprocess.PIPE, stdout=subprocess.PIPE)
githash = p.communicate()[0][7:].split('\n')[0].strip()

ignoreExtensions = ['.pbxuser','.perspectivev3','.pyc']
ignoreDirs = ['.DS_Store','.git','.gitignore','libTitanium.a','titanium.jar','build','bridge.txt']

def ignore(file):
	 for f in ignoreDirs:
		if file == f:
			return True
	 return False

def generate_jsca():
	 process_args = [sys.executable, os.path.join(doc_dir, 'docgen.py'), '-f', 'jsca', '--stdout']
	 print "Generating JSCA..."
	 print " ".join(process_args)
	 jsca_temp_file = tempfile.TemporaryFile()
	 try:
		 process = subprocess.Popen(process_args, stdout=jsca_temp_file, stderr=subprocess.PIPE)
		 process_return_code = process.wait()
		 if process_return_code != 0:
			 err_output = process.stderr.read()
			 print >> sys.stderr, "Failed to generate JSCA JSON.  Output:"
			 print >> sys.stderr, err_output
			 sys.exit(1)
		 jsca_temp_file.seek(0)
		 jsca_json = jsca_temp_file.read()
		 return jsca_json
	 finally:
		 jsca_temp_file.close()

def zip_dir(zf,dir,basepath,subs=None,cb=None):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories
		for file in files:
			e = os.path.splitext(file)
			if len(e)==2 and e[1] in ignoreExtensions: continue
			from_ = os.path.join(root, file)
			to_ = from_.replace(dir, basepath, 1)
			if subs!=None:
				c = open(from_).read()
				for key in subs:
					c = c.replace(key,subs[key])
				if cb!=None:
					c = cb(file,e[1],c)
				zf.writestr(to_,c)
			else:		
				zf.write(from_, to_)

def zip_android(zf, basepath):
	android_dist_dir = os.path.join(top_dir, 'dist', 'android')
	zip_dir(zf, os.path.join(cur_dir,'simplejson'), os.path.join(basepath, 'android', 'simplejson'))

	for jar in ['titanium.jar', 'kroll-apt.jar', 'kroll-common.jar', 'kroll-v8.jar', 'kroll-rhino.jar']:
		jar_path = os.path.join(android_dist_dir, jar)
		zf.write(jar_path, '%s/android/%s' % (basepath, jar))

	# include headers for v8 3rd party module building
	def add_headers(dir):
		for header in os.listdir(dir):
			if not header.endswith('.h'):
				continue
			header_path = os.path.join(dir, header)
			zf.write(header_path, '%s/android/native/include/%s' % (basepath, header))

	android_runtime_dir = os.path.join(top_dir, 'android', 'runtime')
	android_runtime_v8_dir = os.path.join(android_runtime_dir, 'v8')
	android_runtime_rhino_dir = os.path.join(android_runtime_dir, 'rhino')

	v8_src_native_dir = os.path.join(android_runtime_v8_dir, 'src', 'native')
	add_headers(v8_src_native_dir)

	v8_gen_dir = os.path.join(android_runtime_v8_dir, 'generated')
	add_headers(v8_gen_dir)

	import ant
	libv8_properties = ant.read_properties(open(os.path.join(top_dir, 'android', 'build', 'libv8.properties')))
	libv8_version = libv8_properties['libv8.version']
	libv8_mode = libv8_properties['libv8.mode']

	v8_include_dir = os.path.join(android_dist_dir, 'libv8', libv8_version, libv8_mode, 'include')
	add_headers(v8_include_dir)

	# add js2c.py for js -> C embedding
	js2c_py = os.path.join(android_runtime_v8_dir, 'tools', 'js2c.py')
	jsmin_py = os.path.join(android_runtime_v8_dir, 'tools', 'jsmin.py')
	zf.write(js2c_py, '%s/module/android/js2c.py' % basepath)
	zf.write(jsmin_py, '%s/module/android/jsmin.py' % basepath)

	js_jar = os.path.join(android_runtime_rhino_dir, 'lib', 'js.jar')
	zf.write(js_jar, '%s/android/%s' % (basepath, 'js.jar'))

	# include all native shared libraries
	libs_dir = os.path.join(android_dist_dir, 'libs')
	for lib_dir in os.listdir(libs_dir):
		arch_dir = os.path.join(libs_dir, lib_dir)
		for so_file in os.listdir(arch_dir):
			if so_file.endswith('.so'):
				so_path = os.path.join(arch_dir, so_file)
				zf.write(so_path, '%s/android/native/libs/%s/%s' % (basepath, lib_dir, so_file))

	ant_tasks_jar = os.path.join(android_dist_dir, 'ant-tasks.jar')
	zf.write(ant_tasks_jar, '%s/module/android/ant-tasks.jar' % basepath)

	ant_contrib_jar = os.path.join(top_dir, 'android', 'build', 'lib', 'ant-contrib-1.0b3.jar')
	zf.write(ant_contrib_jar, '%s/module/android/ant-contrib-1.0b3.jar' % basepath)

	kroll_apt_lib_dir = os.path.join(top_dir, 'android', 'kroll-apt', 'lib')
	for jar in os.listdir(kroll_apt_lib_dir):
		if jar.endswith('.jar'):
			jar_path = os.path.join(kroll_apt_lib_dir, jar)
			zf.write(jar_path, '%s/android/%s' % (basepath, jar))

	android_depends = os.path.join(top_dir, 'android', 'dependency.json')
	zf.write(android_depends, '%s/android/dependency.json' % basepath)

	android_modules = os.path.join(android_dist_dir, 'modules.json')
	zf.write(android_modules, '%s/android/modules.json' % basepath)

	titanium_lib_dir = os.path.join(top_dir, 'android', 'titanium', 'lib')
	for thirdparty_jar in os.listdir(titanium_lib_dir):
		if thirdparty_jar == "commons-logging-1.1.1.jar": continue
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

	android_module_res_zips = glob.glob(os.path.join(android_dist_dir, 'titanium-*.res.zip'))
	for android_module_res_zip in android_module_res_zips:
		zipname = os.path.split(android_module_res_zip)[1]
		zf.write(android_module_res_zip, '%s/android/modules/%s' % (basepath, zipname))

def resolve_source_imports(platform):
	sys.path.append(iphone_dir)
	import run,prereq
	return importresolver.resolve_source_imports(os.path.join(top_dir,platform,'Classes'))

def make_symbol(fn):
	if fn.startswith('TI') and fn!='TITANIUM' and fn!='TI':
		return fn[2:]
	return fn

def zip_iphone_ipad(zf,basepath,platform,version,version_tag):
	  
#	zf.writestr('%s/iphone/imports.json'%basepath,resolve_source_imports(platform))
	
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

	subs = {
		"__VERSION__":version,
		"__TIMESTAMP__":ts,
		"__GITHASH__": githash
	}
	
	# xcode_templates_dir =  os.path.join(top_dir,'iphone','templates','xcode')
	# zip_dir(zf,xcode_templates_dir,basepath+'/iphone/xcode/templates',subs)
	
	iphone_lib = os.path.join(top_dir,'iphone',platform,'build')
	
	zip_dir(zf,os.path.join(top_dir,'iphone','Classes'),basepath+'/iphone/Classes',subs)
	zip_dir(zf,os.path.join(top_dir,'iphone','headers'),basepath+'/iphone/headers',subs)
	zip_dir(zf,os.path.join(top_dir,'iphone','iphone'),basepath+'/iphone/iphone',subs)
	
	ticore_lib = os.path.join(top_dir,'iphone','lib')
	
	# during 1.3.3, we added a new lib to a folder that had a .gitignore
	# and we need to manually reset this
	if not os.path.exists(os.path.join(ticore_lib,'libtiverify.a')):
		os.system("git checkout iphone/lib")
		if not os.path.exists(os.path.join(ticore_lib,'libtiverify.a')):
			print "[ERROR] missing libtiverify.a!  make sure you checkout iphone/lib or edit your iphone/.gitignore and remove the lib entry"
			sys.exit(1)

	if not os.path.exists(os.path.join(ticore_lib,'libti_ios_debugger.a')):
		os.system("git checkout iphone/lib")
		if not os.path.exists(os.path.join(ticore_lib,'libti_ios_debugger.a')):
			print "[ERROR] missing libti_ios_debugger.a!  make sure you checkout iphone/lib or edit your iphone/.gitignore and remove the lib entry"
			sys.exit(1)
		
	if not os.path.exists(os.path.join(ticore_lib,'libTiCore.a')):
		print "[ERROR] missing libTiCore.a!"
		sys.exit(1)
	
	zf.write(os.path.join(ticore_lib,'libTiCore.a'),'%s/%s/libTiCore.a'%(basepath,platform))
	zf.write(os.path.join(ticore_lib,'libtiverify.a'),'%s/%s/libtiverify.a'%(basepath,platform))
	zf.write(os.path.join(ticore_lib,'libti_ios_debugger.a'),'%s/%s/libti_ios_debugger.a'%(basepath,platform))
	
	zip_dir(zf,osx_dir,basepath)
	
	modules_dir = os.path.join(top_dir,'iphone','Resources','modules')
	for f in os.listdir(modules_dir):
		if os.path.isdir(os.path.join(modules_dir,f)):
			module_images = os.path.join(modules_dir,f)
			if os.path.exists(module_images):
				module_name = f.replace('Module','').lower()
				zip_dir(zf,module_images,'%s/%s/modules/%s/images' % (basepath,platform,module_name))
	
def zip_mobileweb(zf,basepath,version):
	subs = {
		"__VERSION__":version,
		"__TIMESTAMP__":ts,
		"__GITHASH__": githash
	}
	zip_dir(zf,os.path.join(top_dir,'mobileweb','src'),os.path.join(basepath,'mobileweb','src'),subs)

def create_platform_zip(platform,dist_dir,osname,version,version_tag):
	if not os.path.exists(dist_dir):
		os.makedirs(dist_dir)
	basepath = '%s/%s/%s' % (platform,osname,version_tag)
	sdkzip = os.path.join(dist_dir,'%s-%s-%s.zip' % (platform,version_tag,osname))
	zf = zipfile.ZipFile(sdkzip, 'w', zipfile.ZIP_DEFLATED)
	return (zf,basepath)

def zip_mobilesdk(dist_dir,osname,version,android,iphone,ipad,mobileweb,version_tag):
	zf, basepath = create_platform_zip('mobilesdk',dist_dir,osname,version,version_tag)

	version_txt = """version=%s
timestamp=%s
githash=%s
""" % (version,ts,githash)

	zf.writestr('%s/version.txt' % basepath,version_txt)
	jsca = generate_jsca()
	zf.writestr('%s/api.jsca' % basepath, jsca)
	
	zip_dir(zf,all_dir,basepath)
	zip_dir(zf,template_dir,basepath)
	if android: zip_android(zf,basepath)
	if (iphone or ipad) and osname == "osx": zip_iphone_ipad(zf,basepath,'iphone',version,version_tag)
	if mobileweb: zip_mobileweb(zf,basepath,version)
	if osname == 'win32':
		zip_dir(zf, win32_dir, basepath)
	
	zf.close()
				
def zip_it(dist_dir,osname,version,android,iphone,ipad,mobileweb,version_tag):
	zip_mobilesdk(dist_dir,osname,version,android,iphone,ipad,mobileweb,version_tag)

class Packager(object):
	def __init__(self):
		self.os_names = { "Windows":"win32", "Linux":"linux", "Darwin":"osx" }
	 
	def build(self,dist_dir,version,android=True,iphone=True,ipad=True,mobileweb=True,version_tag=None):
		if version_tag == None:
			version_tag = version
		zip_it(dist_dir,self.os_names[platform.system()],version,android,iphone,ipad,mobileweb,version_tag)

	def build_all_platforms(self,dist_dir,version,android=True,iphone=True,ipad=True,mobileweb=True,version_tag=None):
		if version_tag == None:
			version_tag = version
		for os in self.os_names.values():
			zip_it(dist_dir,os,version,android,iphone,ipad,mobileweb,version_tag)
		
if __name__ == '__main__':
	Packager().build(os.path.abspath('../dist'), "1.1.0")
