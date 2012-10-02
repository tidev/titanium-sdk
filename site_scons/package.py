#!/usr/bin/env python
#
# zip up the titanium mobile SDKs into suitable distribution formats
#
import os, types, glob, shutil, sys, platform, codecs
import zipfile, datetime, subprocess, tempfile, time

sys.path.append(os.path.join(os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename)),'..','support','common'))
import simplejson

if platform.system() == 'Darwin':
	import importresolver

packaging_all = False
os_names = { "Windows":"win32", "Linux":"linux", "Darwin":"osx" }
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

p = subprocess.Popen([gitCmd,"show","--abbrev-commit","--no-color"],stderr=subprocess.PIPE, stdout=subprocess.PIPE)
githash = p.communicate()[0][7:].split('\n')[0].strip()

ignoreExtensions = ['.pbxuser','.perspectivev3','.pyc']
ignoreDirs = ['.DS_Store','.git','.gitignore','libTitanium.a','titanium.jar','build','bridge.txt', 'packaged']

def remove_existing_zips(dist_dir, version_tag):
	for os_name in os_names.values():
		filename = os.path.join(dist_dir,
				'mobilesdk-%s-%s.zip' % (version_tag, os_name))
		if os.path.exists(filename):
			os.remove(filename)

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
			 return None
		 jsca_temp_file.seek(0)
		 jsca_json = jsca_temp_file.read()
		 return jsca_json
	 finally:
		 jsca_temp_file.close()

def zip_dir(zf,dir,basepath,subs=None,cb=None, ignore_paths=None):
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories
		for file in files:
			if ignore_paths != None and os.path.join(root, file) in ignore_paths: continue
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

def zip2zip(src_zip, dest_zip, prepend_path=None):
	for zinfo in src_zip.infolist():
		f = src_zip.open(zinfo)
		new_name = zinfo.filename
		if prepend_path and not prepend_path.endswith("/"):
			prepend_path = "%s/" % prepend_path
		if prepend_path:
			new_name = "%s%s" % (prepend_path, new_name)
		zinfo.filename = new_name
		dest_zip.writestr(zinfo, f.read())

def zip_packaged_modules(zf, source_dir):
	for root, dirs, files in os.walk(source_dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)
		for fname in files:
			if not fname.lower().endswith(".zip"):
				continue
			source_zip = zipfile.ZipFile(os.path.join(root, fname), "r")
			rel_path = root.replace(source_dir, "").replace("\\", "/")
			if rel_path.startswith("/"):
				rel_path = rel_path[1:]
			try:
				zip2zip(source_zip, zf, rel_path)
			finally:
				source_zip.close()

def zip_android(zf, basepath, version):
	android_dist_dir = os.path.join(top_dir, 'dist', 'android')

	for jar in ['titanium.jar', 'kroll-apt.jar', 'kroll-common.jar', 'kroll-v8.jar', 'kroll-rhino.jar']:
		jar_path = os.path.join(android_dist_dir, jar)
		zf.write(jar_path, '%s/android/%s' % (basepath, jar))
	
	zip_dir(zf, os.path.join(top_dir, 'android', 'cli'), basepath+'/android/cli')
	zip_dir(zf, os.path.join(top_dir, 'android', 'templates'), basepath+'/android/templates')

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
	
	zf.writestr('%s/android/package.json' % basepath, codecs.open(os.path.join(top_dir, 'android', 'package.json'), 'r', 'utf-8').read().replace('__VERSION__', version))
	
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
	zf.write(os.path.join(top_dir, 'iphone', 'AppledocSettings.plist'),'%s/iphone/AppledocSettings.plist'%(basepath))
	zip_dir(zf, os.path.join(top_dir, 'iphone', 'cli'), basepath+'/iphone/cli')
	zip_dir(zf, os.path.join(top_dir, 'iphone', 'templates'), basepath+'/iphone/templates')
	
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
	
	zf.writestr('%s/%s/package.json' % (basepath, platform), codecs.open(os.path.join(top_dir, 'iphone', 'package.json'), 'r', 'utf-8').read().replace('__VERSION__', version))
	
	zip_dir(zf,osx_dir,basepath)
	
	modules_dir = os.path.join(top_dir,'iphone','Resources','modules')
	for f in os.listdir(modules_dir):
		if os.path.isdir(os.path.join(modules_dir,f)):
			module_images = os.path.join(modules_dir,f)
			if os.path.exists(module_images):
				module_name = f.replace('Module','').lower()
				zip_dir(zf,module_images,'%s/%s/modules/%s/images' % (basepath,platform,module_name))
	
def zip_mobileweb(zf, basepath, version):
	dir = os.path.join(top_dir, 'mobileweb')
	
	# for speed, mobileweb has its own zip logic
	for root, dirs, files in os.walk(dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)
		for file in files:
			e = os.path.splitext(file)
			if len(e)==2 and e[1] in ignoreExtensions: continue
			from_ = os.path.join(root, file)
			to_ = from_.replace(dir, os.path.join(basepath,'mobileweb'), 1)
			zf.write(from_, to_)

def resolve_npm_deps(dir, version, build_v3):
	package_json_file = os.path.join(dir, 'package.json')
	if os.path.exists(package_json_file):
		# ensure fresh npm install for everything EXCEPT titanium-sdk
		node_modules_dir = os.path.join(dir, 'node_modules')
		if os.path.exists(node_modules_dir):
			for file in os.listdir(node_modules_dir):
				if file != 'titanium-sdk':
					file = os.path.join(node_modules_dir, file)
					if os.path.isdir(file):
						shutil.rmtree(file, True)
					else:
						os.remove(file);
		
		package_json_original = codecs.open(package_json_file, 'r', 'utf-8').read()
		package_json_contents = package_json_original
		
		subs = {
			"__VERSION__": version,
			"__TIMESTAMP__": ts,
			"__GITHASH__": githash
		}
		for key in subs:
			package_json_contents = package_json_contents.replace(key, subs[key])
		codecs.open(package_json_file, 'w', 'utf-8').write(package_json_contents)
		
		node_installed = False
		node_version = ''
		node_minimum_minor_ver = 6
		node_too_old = False
		npm_installed = False
		
		try:
			p = subprocess.Popen('node --version', shell=True, cwd=dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
			stdout, stderr = p.communicate()
			if p.returncode == 0:
				node_installed = True
				
				ver = stdout.strip()
				if ver[0] == 'v':
					ver = ver[1:]
				node_version = ver
				ver = ver.split('.')
				if len(ver) > 1 and int(ver[0]) == 0 and int(ver[1]) < node_minimum_minor_ver:
					node_too_old = True
				
				p = subprocess.Popen('npm --version', shell=True, cwd=dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
				stdout, stderr = p.communicate()
				if p.returncode == 0:
					npm_installed = True
		except:
			pass
		
		if build_v3:
			if not node_installed:
				codecs.open(package_json_file, 'w', 'utf-8').write(package_json_original)
				print '[ERROR] Unable to find node.js. Please download and install: http://nodejs.org/'
				sys.exit(1)
			elif node_too_old:
				codecs.open(package_json_file, 'w', 'utf-8').write(package_json_original)
				print '[ERROR] Your version of node.js %s is too old. Please download and install a newer version: http://nodejs.org/' % node_version
				sys.exit(1)
			elif not npm_installed:
				codecs.open(package_json_file, 'w', 'utf-8').write(package_json_original)
				print '[ERROR] Unable to find npm. Please download and install: http://nodejs.org/'
				sys.exit(1)
			
			# need to npm install all node dependencies
			print 'Calling npm from %s' % dir
			p = subprocess.Popen('npm install', shell=True, cwd=dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
			stdout, stderr = p.communicate()
			if p.returncode != 0:
				codecs.open(package_json_file, 'w', 'utf-8').write(package_json_original)
				print '[ERROR] Failed to npm install dependencies'
				print stdout
				print stderr
				sys.exit(1)
		else:
			if not node_installed:
				print '[WARN] Unable to find node.js, which is required for version 3.0. Please download and install: http://nodejs.org/'
			elif node_too_old:
				print '[WARN] Your version of node.js %s is too old. Titanium 3.0 requires 0.%s or newer. Please download and install a newer version: http://nodejs.org/' % (node_version, node_minimum_minor_ver)
			elif not npm_installed:
				print '[WARN] Unable to find npm, which is required for version 3.0. Please download and install: http://nodejs.org/'
		
	return lambda: None if not os.path.exists(package_json_file) else codecs.open(package_json_file, 'w', 'utf-8').write(package_json_original)

def create_platform_zip(platform,dist_dir,osname,version,version_tag):
	if not os.path.exists(dist_dir):
		os.makedirs(dist_dir)
	basepath = '%s/%s/%s' % (platform,osname,version_tag)
	sdkzip = os.path.join(dist_dir,'%s-%s-%s.zip' % (platform,version_tag,osname))
	zf = zipfile.ZipFile(sdkzip, 'w', zipfile.ZIP_DEFLATED)
	return (zf, basepath, sdkzip)

def zip_mobilesdk(dist_dir, osname, version, module_apiversion, android, iphone, ipad, mobileweb, version_tag, build_v3, build_jsca):
	zf, basepath, filename = create_platform_zip('mobilesdk', dist_dir, osname, version, version_tag)

	version_txt = """version=%s
module_apiversion=%s
timestamp=%s
githash=%s
""" % (version,module_apiversion,ts,githash)
	zf.writestr('%s/version.txt' % basepath,version_txt)
	
	platforms = []
	for dir in os.listdir(top_dir):
		if dir != 'support' and os.path.isdir(os.path.join(top_dir, dir)) and os.path.isfile(os.path.join(top_dir, dir, 'package.json')):
			# if new platforms are added, be sure to add them to the line below!
			if (dir == 'android' and android) or (dir == 'iphone' and (iphone or ipad)) or (dir == 'mobileweb' and mobileweb):
				platforms.append(dir)
	
	manifest_json = '''{
	"version": "%s",
	"moduleAPIVersion": "%s",
	"timestamp": "%s",
	"githash": "%s",
	"platforms": %s
}''' % (version, module_apiversion, ts, githash, simplejson.dumps(platforms))
	zf.writestr('%s/manifest.json' % basepath, manifest_json)
	
	# get all SDK level npm dependencies
	resolve_npm_deps(template_dir, version, build_v3)()
	
	# check if we should build the content assist file
	if build_jsca:
		jsca = generate_jsca()
		if jsca is None:
			# This is fatal. If we were meant to build JSCA
			# but couldn't, then packaging fails.
			# Delete the zip to be sure any build/packaging
			# script that fails to read the exit code
			# will at least not have any zip file.
			zf.close()
			if os.path.exists(filename):
				os.remove(filename)
			# If the script was in the middle of packaging
			# for all platforms, remove zips for all platforms
			# to make it clear that packaging failed (since all
			# platforms get the api.jsca which has just failed.)
			if packaging_all:
				remove_existing_zips(dist_dir, version_tag)
			sys.exit(1)

		zf.writestr('%s/api.jsca' % basepath, jsca)
	
	zip_packaged_modules(zf, os.path.join(template_dir, "module", "packaged"))
	zip_dir(zf, all_dir, basepath)
	zip_dir(zf, template_dir, basepath, ignore_paths=[os.path.join(template_dir, 'package.json')]) # ignore the dependency package.json
	if android: zip_android(zf, basepath, version)
	if (iphone or ipad) and osname == "osx": zip_iphone_ipad(zf,basepath,'iphone',version,version_tag)
	if mobileweb: zip_mobileweb(zf, basepath, version)
	if osname == 'win32':
		zip_dir(zf, win32_dir, basepath)
	
	zf.close()
				
def zip_it(dist_dir, osname, version, module_apiversion, android,iphone, ipad, mobileweb, version_tag, build_v3, build_jsca):
	zip_mobilesdk(dist_dir, osname, version, module_apiversion, android, iphone, ipad, mobileweb, version_tag, build_v3, build_jsca)

class Packager(object):
	def __init__(self, build_jsca=1):
		self.build_jsca = build_jsca
	 
	def build(self, dist_dir, version, module_apiversion, android=True, iphone=True, ipad=True, mobileweb=True, version_tag=None, build_v3=False):
		if version_tag == None:
			version_tag = version
		zip_it(dist_dir, os_names[platform.system()], version, module_apiversion, android, iphone, ipad, mobileweb, version_tag, build_v3, self.build_jsca)

	def build_all_platforms(self, dist_dir, version, module_apiversion, android=True, iphone=True, ipad=True, mobileweb=True, version_tag=None, build_v3=False):
		global packaging_all
		packaging_all = True

		if version_tag == None:
			version_tag = version

		remove_existing_zips(dist_dir, version_tag)

		for os in os_names.values():
			zip_it(dist_dir, os, version, module_apiversion, android, iphone, ipad, mobileweb, version_tag, build_v3, self.build_jsca)
		
if __name__ == '__main__':
	Packager().build(os.path.abspath('../dist'), "1.1.0")
