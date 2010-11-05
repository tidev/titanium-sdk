#!/usr/bin/python
import os, sys, platform, subprocess, shutil, zipfile

drillbit_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
drillbit_app_dir = os.path.join(drillbit_dir, 'app')
mobile_dir = os.path.dirname(drillbit_dir)

def error_no_desktop_sdk():
	print >>sys.stderr, "ERROR: Couldn't find Titanium Desktop SDK, which is needed for running Drillbit"
	sys.exit(-1)

def cmp_versions(a, b):
	a_version = [int(x) for x in a.split('.')]
	b_version = [int(x) for x in b.split('.')]
	
	if a_version[0] > b_version[0]: return 1
	elif a_version[0] < b_version[0]: return -1
	else:
		if a_version[1] > b_version[1]: return 1
		elif a_version[1] < b_version[1]: return -1
		else:
			if len(a_version) == 3:
				if len(b_version) == 3:
					return a_version[2]-b_version[2]
				else:
					return a_version[2]
			elif len(b_version) == 3:
				return b_version[2]
			else: return 0
				
def build_and_run(args=None):
	# first we need to find the desktop SDK for tibuild.py
	if platform.system() == 'Darwin':
		base_sdk = '/Library/Application Support/Titanium/sdk/osx'
		platform_name = 'osx'
	elif platform.system() == 'Windows':
		if platform.release() == 'XP':
			base_sdk = 'C:\\Documents and Settings\\All Users\\Application Data\\Titanium\\sdk\\win32'
		else:
			base_sdk = 'C:\\ProgramData\\Titanium\\sdk\\win32'
		platform_name = 'win32'
	elif platform.system() == 'Linux':
		base_sdk = os.path.expanduser("~/.titanium/sdk/linux")
		platform_name = 'linux'
	
	if not os.path.exists(base_sdk):
		error_no_desktop_sdk()
	
	versions = os.listdir(base_sdk)
	if len(versions) == 0:
		error_no_desktop_sdk()
	
	# use the latest version in the system
	versions.sort(cmp_versions)
	use_version = versions[0]
	
	desktop_sdk = os.path.join(base_sdk, use_version)
	tibuild = os.path.join(desktop_sdk, 'tibuild.py')
	drillbit_build_dir = os.path.join(mobile_dir, 'build', 'drillbit')
	mobile_dist_dir = os.path.join(mobile_dir, 'dist')
	
	sys.path.append(mobile_dist_dir)
	sys.path.append(os.path.join(mobile_dir, 'build'))
	import titanium_version
	
	# extract the mobilesdk zip so we can use it for testing
	mobilesdk_dir = os.path.join(mobile_dist_dir, 'mobilesdk', platform_name, titanium_version.version)
	mobilesdk_zip = zipfile.ZipFile(os.path.join(mobile_dist_dir, 'mobilesdk-%s-%s.zip' % (titanium_version.version, platform_name)))
	mobilesdk_zip.extractall(mobile_dist_dir)
	mobilesdk_zip.close()
	
	if not os.path.exists(drillbit_build_dir):
		os.makedirs(drillbit_build_dir)
	
	sys.path.append(desktop_sdk)
	import env
	
	# use the desktop SDK API to stage and run drillbit (along w/ it's custom modules)
	environment = env.PackagingEnvironment(platform_name, False)
	app = environment.create_app(drillbit_app_dir)
	stage_dir = os.path.join(drillbit_build_dir, app.name)
	app.stage(stage_dir, bundle=False)
	app.install()
	
	app_modules_dir = os.path.join(app.get_contents_dir(), 'modules')
	app_tests_dir = os.path.join(app.get_contents_dir(), 'Resources', 'tests')
	
	if os.path.exists(app_modules_dir):
		shutil.rmtree(app_modules_dir)
	
	if os.path.exists(app_tests_dir):
		shutil.rmtree(app_tests_dir)
	
	shutil.copytree(os.path.join(drillbit_dir, 'modules'), app_modules_dir)
	shutil.copytree(os.path.join(drillbit_dir, 'tests'), app_tests_dir)
	
	drillbit_args = [app.executable_path, '--debug', '--mobile-sdk=%s' % mobilesdk_dir]
	if args != None:
		drillbit_args.extend(args)
	
	app.env.run(drillbit_args)

if __name__ == "__main__":
	build_and_run(sys.argv[1:])
