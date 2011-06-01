#!/usr/bin/python
import os, sys, re, platform, subprocess, shutil, zipfile

drillbit_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
drillbit_app_dir = os.path.join(drillbit_dir, 'app')
mobile_dir = os.path.dirname(drillbit_dir)

def error_no_desktop_sdk():
	print >>sys.stderr, "ERROR: Couldn't find Titanium Desktop SDK, which is needed for running Drillbit"
	sys.exit(-1)

class versionPart(object):
	def __init__(self, version, qualifier=None):
		self.version = version
		self.qualifier = qualifier
	
	def __cmp__(self, other):
		diff = self.version - other.version
		if diff != 0:
			return diff
		return cmp(self.qualifier, other.qualifier)

class version(object):
	def __init__(self, version):
		self.parts = []
		for part in version.split('.'):
			match = re.search(r'[^0-9]', part)
			if match == None:
				self.parts.append(int(part))
			else:
				version_str = part[0:match.start()]
				version = 0
				if len(version_str) != 0: version = int(version_str)
				qualifier = part[match.start():]
				self.parts.append((version, qualifier))
	
	def __cmp__(self, other):
		if self.parts[0] > other.parts[0]: return 1
		elif self.parts[0] < other.parts[0]: return -1
		else:
			if self.parts[1] > other.parts[1]: return 1
			elif self.parts[1] < other.parts[1]: return -1
			else:
				if len(self.parts) == 3:
					if len(other.parts) == 3:
						return self.parts[2]-other.parts[2]
					else:
						return self.parts[2]
				elif len(other.parts) == 3:
					return other.parts[2]
				else: return 0

def usage():
	print """
%s [--platforms=PLATFORMS] [--tests-dir=DIR] [--results-dir=DIR] [--tests=TESTS] [platform specific args..]
    Common Arguments
    --platforms=PLATFORMS           A list of platforms to run Drillbit for (default: android,iphone)
    --tests-dir=DIR                 Additional tests are loaded from DIR
    --results-dir=DIR               Generates JSON and HTML results in DIR
    --tests=TESTS                   Specify which test suites to enable by default (separated by comma)

    UI Specific arguments:
    --autorun                       Start running tests as soon as Drillibit starts
    --autoclose                     Close Drillbit as soon as all tests are finished running
    --web-console                   Launch Drillbit with the Web / Javascript Console showing (for debugging Drillbit itself)

    iPhone Specific Arguments
    --iphone-version=DIR            The iPhone SDK version to build against (default: 4.0)
    
    Android Specific Arguments
    --android-sdk=DIR               Android SDK is loaded from DIR
    --android-version=VERSION       The Android Platform version to build against (default: 4)
    --android-force-build           When passed, the test harness is forcefully built on initial deploy
    --android-device=DEVICE         The device argument to pass to ADB.
                                    Valid values: emulator (-e), device (-d), or specific serial (default: emulator)
""" % sys.argv[0]
	sys.exit(1)

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
	
	versions = [dir for dir in os.listdir(base_sdk) if not dir.startswith(".")]
	if len(versions) == 0:
		error_no_desktop_sdk()
	
	# use the latest version in the system
	versions.sort()
	use_version = versions[len(versions) - 1]
	print 'Using Desktop version %s' % use_version
	
	desktop_sdk = os.path.join(base_sdk, use_version)
	tibuild = os.path.join(desktop_sdk, 'tibuild.py')
	drillbit_build_dir = os.path.join(mobile_dir, 'build', 'drillbit')
	mobile_dist_dir = os.path.join(mobile_dir, 'dist')
	
	sys.path.append(mobile_dist_dir)
	sys.path.append(os.path.join(mobile_dir, 'build'))
	import titanium_version
	
	mobilesdk_dir = os.path.join(mobile_dist_dir, 'mobilesdk', platform_name, titanium_version.version)
	mobilesdk_zipfile = os.path.join(mobile_dist_dir, 'mobilesdk-%s-%s.zip' % (titanium_version.version, platform_name))
	if platform.system() == 'Darwin':
		subprocess.Popen(['/usr/bin/unzip', '-q', '-o', '-d', mobile_dist_dir, os.path.join(mobile_dist_dir, 'mobilesdk-%s-%s.zip' % (titanium_version.version, platform_name))])
	else:
		# extract the mobilesdk zip so we can use it for testing
		mobilesdk_zip = zipfile.ZipFile(mobilesdk_zipfile)
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
	
	drillbit_args = [app.executable_path, '--debug', '--mobile-sdk=%s' % mobilesdk_dir, '--mobile-repository=%s' % mobile_dir]
	if args != None:
		drillbit_args.extend(args)
	
	app.env.run(drillbit_args)

if __name__ == "__main__":
	build_and_run(sys.argv[1:])
