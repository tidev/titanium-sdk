#!/usr/bin/python
import os, sys, re, platform, subprocess, shutil, zipfile

drillbit_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
drillbit_app_dir = os.path.join(drillbit_dir, 'app')
mobile_dir = os.path.dirname(drillbit_dir)

# first we need to find the desktop SDK for tibuild.py
sdk_dirs = []
if platform.system() == 'Darwin':
	system_sdk = '/Library/Application Support/Titanium/sdk/osx'
	if os.path.exists(system_sdk):
		sdk_dirs.append(system_sdk)
	user_sdk = os.path.expanduser('~/Library/Application Support/Titanium/sdk/osx')
	if os.path.exists(user_sdk):
		sdk_dirs.append(user_sdk)
	platform_name = 'osx'
elif platform.system() == 'Windows':
	if platform.release() == 'XP':
		system_sdk = 'C:\\Documents and Settings\\All Users\\Application Data\\Titanium\\sdk\\win32'
	else:
		system_sdk = 'C:\\ProgramData\\Titanium\\sdk\\win32'
	if os.path.exists(system_sdk):
		sdk_dirs.append(system_sdk)
	# TODO: support User SDK installs in win32
	platform_name = 'win32'
elif platform.system() == 'Linux':
	user_sdk = os.path.expanduser("~/.titanium/sdk/linux")
	if os.path.exists(user_sdk):
		sdk_dirs.append(user_sdk)
	# TODO: support System SDK installs in linux
	platform_name = 'linux'

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

def extract_mobilesdk(extract=True):
	mobile_dist_dir = os.path.join(mobile_dir, 'dist')
	sys.path.append(mobile_dist_dir)
	sys.path.append(os.path.join(mobile_dir, 'build'))
	import titanium_version
	
	mobilesdk_dir = os.path.join(mobile_dist_dir, 'mobilesdk', platform_name, titanium_version.version)
	mobilesdk_zipfile = os.path.join(mobile_dist_dir, 'mobilesdk-%s-%s.zip' % (titanium_version.version, platform_name))
	if not extract:
		return mobilesdk_dir

	if platform.system() == 'Darwin':
		subprocess.Popen(['/usr/bin/unzip', '-q', '-o', '-d', mobile_dist_dir, mobilesdk_zipfile])
	else:
		# extract the mobilesdk zip so we can use it for testing
		mobilesdk_zip = zipfile.ZipFile(mobilesdk_zipfile)
		mobilesdk_zip.extractall(mobile_dist_dir)
		mobilesdk_zip.close()
	return mobilesdk_dir

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
    --reset-config                  Resets current configuration of window and tests to default


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
	if len(args) == 1 and args[0] in ["--help", "-h"]:
		usage()

	if len(sdk_dirs) == 0:
		error_no_desktop_sdk()

	version_dirs = []
	for sdk_dir in sdk_dirs:
		for dir in os.listdir(sdk_dir):
			if dir.startswith("."): continue
			version_dirs.append(os.path.join(sdk_dir, dir))

	if len(version_dirs) == 0:
		error_no_desktop_sdk()

	version_map = {}
	for version_dir in version_dirs:
		version_map[os.path.basename(version_dir)] = version_dir

	# use the latest version in the system
	versions = version_map.keys()
	versions.sort()
	use_version = versions[-1]

	print 'Using Desktop version %s in %s' % (use_version, version_map[use_version])

	desktop_sdk = version_map[use_version]
	tibuild = os.path.join(desktop_sdk, 'tibuild.py')
	drillbit_build_dir = os.path.join(mobile_dir, 'build', 'drillbit')

	extract = 'NO_EXTRACT' not in os.environ
	mobilesdk_dir = extract_mobilesdk(extract)

	if not os.path.exists(drillbit_build_dir):
		os.makedirs(drillbit_build_dir)

	sys.path.append(desktop_sdk)
	import env

	# use the desktop SDK API to stage and run drillbit (along w/ its custom modules)
	appstore = False
	bundle = False

	# if we're in OSX Lion, package against the system webkit (using --appstore)
	if platform.system() == "Darwin" and platform.release() == "11.0.0":
		appstore = True
		bundle = True

	# the win32 env.py doesn't have the appstore flag for some reason
	if platform.system() == "Windows":
		environment = env.PackagingEnvironment(platform_name, False)
	else:
		environment = env.PackagingEnvironment(platform_name, False, appstore)
	app = environment.create_app(drillbit_app_dir)
	stage_dir = os.path.join(drillbit_build_dir, app.name)

	# This isn't set internally until stage() is set, but by then it's too
	# late for module resolving
	app.stage_dir = stage_dir
	if platform.system() == 'Darwin':
		app.stage_dir += '.app'

	# We need this to resolve our custom modules
	app.env.components_dir = app.get_contents_dir()

	app_modules_dir = os.path.join(app.get_contents_dir(), 'modules')
	if os.path.exists(app_modules_dir):
		shutil.rmtree(app_modules_dir)
	elif not os.path.exists(app.get_contents_dir()):
		os.makedirs(app.get_contents_dir())

	print 'Copying modules to %s' % app_modules_dir
	shutil.copytree(os.path.join(drillbit_dir, 'modules'), app_modules_dir)

	# Desktop 1.2 doesn't pass on named-args for app subclasses
	# stage(stage_dir, bundle=False, no_install=True, js_obfuscate=False
	app.stage(stage_dir, bundle, True, False)

	app_tests_dir = os.path.join(app.get_contents_dir(), 'Resources', 'tests')
	if os.path.exists(app_tests_dir):
		shutil.rmtree(app_tests_dir)

	print 'Copying tests to %s' % app_tests_dir
	shutil.copytree(os.path.join(drillbit_dir, 'tests'), app_tests_dir)

	installed_file = os.path.join(app.get_contents_dir(), '.installed')
	if not os.path.exists(installed_file):
		open(installed_file, "w").write('installed')

	drillbit_args = [app.executable_path, '--debug', '--mobile-sdk=%s' % mobilesdk_dir, '--mobile-repository=%s' % mobile_dir]
	if args != None:
		drillbit_args.extend(args)

	app.env.run(drillbit_args)

if __name__ == "__main__":
	build_and_run(sys.argv[1:])
